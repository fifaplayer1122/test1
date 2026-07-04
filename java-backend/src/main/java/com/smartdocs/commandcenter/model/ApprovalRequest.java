package com.smartdocs.commandcenter.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "approval_requests")
public class ApprovalRequest {
    @Id
    private String id;
    private String requestedBy;
    private String title;
    private String category;
    private String reason;
    private double cost;
    private String priority;
    private String status;
    private String adminNote;
    private Instant createdAt;
}
