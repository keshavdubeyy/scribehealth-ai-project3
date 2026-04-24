package com.scribehealth.pattern.strategy;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * FR-12 + FR-09: Stakeholder notification service using Strategy pattern.
 *
 * NotificationService holds a registered list of strategies and fans out
 * every event to all of them in one call.
 *
 * This is the Context class in the Strategy pattern - it maintains a reference
 * to a strategy interface and delegates execution to the concrete strategies.
 */
@Service
public class NotificationService {
    
    private final List<NotificationStrategy> strategies = new ArrayList<>();
    
    /**
     * Registers a notification strategy.
     * @param strategy the strategy to register
     * @return this service for method chaining
     */
    public NotificationService register(NotificationStrategy strategy) {
        strategies.add(strategy);
        return this;
    }
    
    /**
     * Unregisters a notification strategy.
     * @param strategy the strategy to unregister
     * @return this service for method chaining
     */
    public NotificationService unregister(NotificationStrategy strategy) {
        strategies.remove(strategy);
        return this;
    }
    
    /**
     * Sends a notification to all registered strategies.
     * Each strategy sends the notification via its channel.
     * Failures in individual strategies are logged but don't block others.
     *
     * @param payload the notification payload
     */
    public void fire(NotificationPayload payload) {
        for (NotificationStrategy strategy : strategies) {
            try {
                if (strategy.isAvailable()) {
                    strategy.fire(payload);
                }
            } catch (NotificationException e) {
                // Log but don't block other strategies
                System.err.printf("Notification failed for channel %s: %s%n", 
                    strategy.getChannel(), e.getMessage());
            }
        }
    }
    
    /**
     * Returns the number of registered strategies.
     * @return channel count
     */
    public int getChannelCount() {
        return strategies.size();
    }
    
    /**
     * Returns the number of available (configured) strategies.
     * @return available channel count
     */
    public int getAvailableChannelCount() {
        return (int) strategies.stream().filter(NotificationStrategy::isAvailable).count();
    }
    
    /**
     * Clears all registered strategies.
     */
    public void clear() {
        strategies.clear();
    }
}
