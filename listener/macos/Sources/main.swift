import ScreenCaptureKit

struct ListenerError: Error, CustomDebugStringConvertible {
    var debugDescription: String
    init(_ debugDescription: String) { self.debugDescription = debugDescription }
}

@available(macOS 14.0, *)
class StreamOutput: NSObject, SCStreamOutput {
    func stream(
        _ stream: SCStream, didOutputSampleBuffer sampleBuffer: CMSampleBuffer,
        of outputType: SCStreamOutputType
    ) {
        guard sampleBuffer.isValid else { return }

        switch outputType {
        case .screen:
            break
        case .audio:
            var bufferListSizeNeeded: Int = 0;

            CMSampleBufferGetAudioBufferListWithRetainedBlockBuffer(
                sampleBuffer,
                bufferListSizeNeededOut: &bufferListSizeNeeded,
                bufferListOut: nil,
                bufferListSize: 0,
                blockBufferAllocator: nil,
                blockBufferMemoryAllocator: nil,
                flags: 0,
                blockBufferOut: nil)

            let bufferList: UnsafeMutablePointer<AudioBufferList> =
                UnsafeMutablePointer
                .allocate(capacity: bufferListSizeNeeded)

            var blockBuffer: CMBlockBuffer?

            let status = CMSampleBufferGetAudioBufferListWithRetainedBlockBuffer(
                sampleBuffer,
                bufferListSizeNeededOut: nil,
                bufferListOut: bufferList, bufferListSize: bufferListSizeNeeded,
                blockBufferAllocator: nil, blockBufferMemoryAllocator: nil,
                flags: 0, blockBufferOut: &blockBuffer)

            if (status != noErr) {
                NSLog(
                    NSError.init(domain: NSOSStatusErrorDomain, code: Int(status))
                        .localizedDescription)
            }

            if blockBuffer == nil {
                NSLog("Could not unpack data from CMBlockBuffer")
            }

            let format = AVAudioFormat.init(standardFormatWithSampleRate: 44100, channels: 2)

            if (format == nil) {
                NSLog("Could not create AVAudioFormat.")
            }

            let buffer = AVAudioPCMBuffer.init(
                pcmFormat: format!, bufferListNoCopy: bufferList)

            let frameCapacity = Int(buffer?.frameCapacity ?? 0)

            let bytes = UnsafeBufferPointer(
                start: buffer?.floatChannelData, count: frameCapacity)

            let data = Data(buffer: bytes)
            FileHandle.standardOutput.write(data)
            break
        case .microphone:
            break
        @unknown default:
            break
        }
    }
}

@available(macOS 14.0, *)
struct Listener: @unchecked Sendable {
    private let audioSampleBufferQueue = DispatchQueue(label: "listener.AudioSampleBufferQueue")
    private let streamOutput: StreamOutput

    private var stream: SCStream

    init() async throws {
        var mainDisplay: SCDisplay?

        do {
            let availableContent = try await SCShareableContent.current
            mainDisplay = Listener.getMainDisplay(availableContent: availableContent)
        } catch {
            throw ListenerError("Could not find shareable content.")
        }

        if mainDisplay == nil {
            throw ListenerError("Could not find main display.")
        }

        let filter = SCContentFilter(display: mainDisplay!, excludingWindows: [])
        let config = Listener.getListenerConfiguration(display: mainDisplay!)

        streamOutput = StreamOutput()
        stream = SCStream(filter: filter, configuration: config, delegate: nil)

        do {
            try stream.addStreamOutput(
                streamOutput, type: .screen,
                sampleHandlerQueue: .main)
            try stream.addStreamOutput(
                streamOutput, type: .audio,
                sampleHandlerQueue: audioSampleBufferQueue)
        } catch {
            throw ListenerError(
                "Error attaching stream outputs",
            )
        }
    }

    static func getMainDisplay(availableContent: SCShareableContent) -> SCDisplay? {
        for display in availableContent.displays {
            if display.displayID == CGMainDisplayID() {
                return display
            }
        }

        return nil
    }

    static func getListenerConfiguration(display: SCDisplay) -> SCStreamConfiguration {
        let streamConfig = SCStreamConfiguration()
        streamConfig.capturesAudio = true
        streamConfig.width = display.width
        streamConfig.height = display.height
        streamConfig.minimumFrameInterval = CMTime(value: 1, timescale: 60)
        streamConfig.queueDepth = 5
        streamConfig.sampleRate = 44100

        return streamConfig
    }

    func begin() async throws {
        try await stream.startCapture()
    }

    func stop() async throws {
        try await stream.stopCapture()
    }
}

@available(macOS 14.0, *)
@main
struct Main {
    static func main() async throws {
        do {
            guard CGPreflightScreenCaptureAccess() else {
                throw ListenerError("No screen capture permission.")
            }

            let listener = try await Listener()
            try await listener.begin()
            _ = readLine()
            try await listener.stop()
        } catch {
            NSLog("Error during recording: %s", error.localizedDescription)
        }
    }
}
