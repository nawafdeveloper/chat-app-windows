import { PollOption, PollWithVotes } from "../components/chat-poll-item";
import { Poll } from "../types/messages.type";


interface PollVoteData {
    options?: { option_id: string; votes: number }[];
    total_votes?: number;
    user_has_voted?: boolean;
    user_selected_options?: string[];
}

export function convertToPollWithVotes(
    poll: Poll,
    voteData: PollVoteData = {}
): PollWithVotes {
    const options: PollOption[] = poll.poll_options.map((text, index) => {
        const optionId = `${poll.poll_id}_opt_${index}`;
        const votes =
            voteData.options?.find((opt) => opt.option_id === optionId)?.votes || 0;
        return {
            option_id: optionId,
            text,
            votes,
        };
    });

    return {
        poll_id: poll.poll_id,
        poll_question: poll.poll_question,
        poll_multiple_answers: poll.poll_multiple_answers,
        options,
        total_votes: voteData.total_votes ?? 0,
        user_has_voted: voteData.user_has_voted ?? false,
        user_selected_options: voteData.user_selected_options ?? [],
    };
}