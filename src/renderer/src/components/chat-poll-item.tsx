import React, { useState } from 'react';
import {
    Box,
    Typography,
    Radio,
    RadioGroup,
    FormControlLabel,
    Checkbox,
    FormGroup,
    Button,
    LinearProgress,
    Paper,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export interface PollWithVotes {
    poll_id: string;
    poll_question: string;
    poll_multiple_answers: boolean;
    options: PollOption[];
    total_votes: number;
    user_has_voted: boolean;
    user_selected_options?: string[];
}

export interface PollOption {
    option_id: string;
    text: string;
    votes: number;
}

interface PollComponentProps {
    poll: PollWithVotes;
    onVote: (pollId: string, selectedOptionIds: string[]) => void;
    isSender?: boolean;
}

// WhatsApp green (can be adjusted)
const GREEN = '#25D366';

const PollComponent: React.FC<PollComponentProps> = ({
    poll,
    onVote,
    isSender = false,
}) => {
    const [selectedOptions, setSelectedOptions] = useState<string[]>(
        poll.user_selected_options || []
    );
    const [voted, setVoted] = useState(poll.user_has_voted);
    const [localPoll, setLocalPoll] = useState(poll);

    const showResults = voted || localPoll.total_votes > 0;

    const handleOptionChange = (optionId: string, checked: boolean) => {
        if (localPoll.poll_multiple_answers) {
            setSelectedOptions((prev) =>
                checked ? [...prev, optionId] : prev.filter((id) => id !== optionId)
            );
        } else {
            setSelectedOptions(checked ? [optionId] : []);
        }
    };

    const handleSubmitVote = () => {
        if (selectedOptions.length === 0) return;
        onVote(localPoll.poll_id, selectedOptions);
        setVoted(true);
    };

    return (
        <Paper
            elevation={0}
            sx={(theme) => ({
                p: 1.5,
                maxWidth: 280,
                bgcolor: theme.palette.mode === 'dark' ? '#222424' : 'white'
            })}
        >
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                {localPoll.poll_question}
            </Typography>
            {localPoll.poll_multiple_answers && (
                <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                    <CheckCircleIcon sx={{ fontSize: 14, color: 'gray' }} />
                    <CheckCircleIcon sx={{ fontSize: 14, color: 'gray', ml: -0.8 }} />
                    <Typography variant="caption" color="gray">
                        Select one or more
                    </Typography>
                </Box>
            )}
            {!showResults ? (
                localPoll.poll_multiple_answers ? (
                    <FormGroup>
                        {localPoll.options.map((opt) => (
                            <FormControlLabel
                                key={opt.option_id}
                                control={
                                    <Checkbox
                                        checked={selectedOptions.includes(opt.option_id)}
                                        onChange={(e) =>
                                            handleOptionChange(opt.option_id, e.target.checked)
                                        }
                                        sx={{
                                            color: 'grey',
                                            '&.Mui-checked': {
                                                color: GREEN,
                                            },
                                        }}
                                        size="small"
                                    />
                                }
                                label={opt.text}
                                sx={{ ml: -1, mb: 0.5 }}
                            />
                        ))}
                    </FormGroup>
                ) : (
                    <RadioGroup
                        value={selectedOptions[0] || ''}
                        onChange={(e) => handleOptionChange(e.target.value, true)}
                    >
                        {localPoll.options.map((opt) => (
                            <FormControlLabel
                                key={opt.option_id}
                                value={opt.option_id}
                                control={
                                    <Radio
                                        size="small"
                                        sx={{
                                            color: 'grey',
                                            '&.Mui-checked': {
                                                color: GREEN,
                                            },
                                        }}
                                    />
                                }
                                label={opt.text}
                                sx={{ ml: -1, mb: 0.5 }}
                            />
                        ))}
                    </RadioGroup>
                )
            ) : (
                <Box>
                    {localPoll.options.map((opt) => {
                        const percent =
                            localPoll.total_votes > 0
                                ? (opt.votes / localPoll.total_votes) * 100
                                : 0;
                        return (
                            <Box key={opt.option_id} mb={1.5}>
                                <Box
                                    display="flex"
                                    justifyContent="space-between"
                                    alignItems="center"
                                    mb={0.5}
                                >
                                    <Typography variant="body2">{opt.text}</Typography>
                                    <Typography variant="caption" fontWeight="medium">
                                        {Math.round(percent)}%
                                    </Typography>
                                </Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={percent}
                                    sx={{
                                        height: 6,
                                        borderRadius: 3,
                                        backgroundColor: 'action.hover',
                                        '& .MuiLinearProgress-bar': {
                                            borderRadius: 3,
                                            backgroundColor: GREEN,
                                        },
                                    }}
                                />
                                <Typography variant="caption" color="gray">
                                    {opt.votes} {opt.votes === 1 ? 'vote' : 'votes'}
                                </Typography>
                            </Box>
                        );
                    })}
                    <Typography variant="caption" color="gray" display="block" mt={1}>
                        {localPoll.total_votes}{' '}
                        {localPoll.total_votes === 1 ? 'vote' : 'votes'}
                    </Typography>
                </Box>
            )}
            {!showResults && (
                <Button
                    size="small"
                    disabled={selectedOptions.length === 0}
                    onClick={handleSubmitVote}
                    sx={(theme) => ({
                        mt: 2,
                        width: '100%',
                        textTransform: 'none',
                        borderRadius: 2,
                        backgroundColor: theme.palette.mode === "dark" ? "#353838" : "#E0E0E0",
                        color: theme.palette.mode === "dark" ? "#25D366" : "#1F4E2E",
                        '&:hover': {
                            backgroundColor: theme.palette.mode === "dark" ? "#24352A" : GREEN,
                        },
                    })}
                >
                    Vote
                </Button>
            )}
        </Paper>
    );
};

export default PollComponent;