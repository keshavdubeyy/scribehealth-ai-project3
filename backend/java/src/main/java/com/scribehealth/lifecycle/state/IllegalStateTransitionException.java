package com.scribehealth.lifecycle.state;

public class IllegalStateTransitionException extends RuntimeException {
    public IllegalStateTransitionException(String from, String to) {
        super("Illegal state transition: " + from + " → " + to);
    }
}
