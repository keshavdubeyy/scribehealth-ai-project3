package com.scribehealth.lifecycle.state;

public class ConsultationStateFactory {
    public static ConsultationState fromStatus(String status) {
        return switch (status) {
            case "SCHEDULED"    -> new ScheduledState();
            case "IN_PROGRESS"  -> new InProgressState();
            case "RECORDED"     -> new RecordedState();
            case "TRANSCRIBED"  -> new TranscribedState();
            case "UNDER_REVIEW" -> new UnderReviewState();
            case "APPROVED"     -> new ApprovedState();
            case "REJECTED"     -> new RejectedState();
            default             -> throw new IllegalArgumentException("Unknown status: " + status);
        };
    }
}
