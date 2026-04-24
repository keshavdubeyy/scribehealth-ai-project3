package com.scribehealth.lifecycle.observer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class SessionStatusObserver implements ConsultationObserver {

    private static final Logger log = LoggerFactory.getLogger(SessionStatusObserver.class);

    @Override
    public void onEvent(ConsultationEvent event) {
        log.info("[LIFECYCLE] session={} transitioned {} → {}",
                event.getSessionId(), event.getFromStatus(), event.getToStatus());
    }
}
