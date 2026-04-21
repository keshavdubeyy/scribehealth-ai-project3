package com.scribehealth.repository;

import com.scribehealth.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    @Query(value = "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT :limit OFFSET :offset",
           nativeQuery = true)
    List<AuditLog> findRecentLogs(@Param("limit") int limit, @Param("offset") int offset);
}
