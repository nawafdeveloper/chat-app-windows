interface Props {
    recordingTime: string;
}

export default function RecordTimer({ recordingTime }: Props) {
    return (
        <div className='flex flex-row items-center gap-x-2 ml-3'>
            <div className='w-4 h-4 bg-red-400 rounded-full animate-pulse' />
            <p>{recordingTime}</p>
        </div>
    );
}
