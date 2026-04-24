package com.scribehealth.lifecycle.state;

public class UnderReviewState implements ConsultationState {
    @Override
    public String statusName() { return "UNDER_REVIEW"; }

    @Override
    public ConsultationState transitionTo(String targetStatus) {
        if ("APPROVED".equals(targetStatus)) return new ApprovedState();
        if ("REJECTED".equals(targetStatus)) return new RejectedState();
        throw new IllegalStateTransitionException(statusName(), targetStatus);
    }
}
