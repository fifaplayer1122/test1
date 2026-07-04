package com.smartdocs.commandcenter.service;

import com.smartdocs.commandcenter.model.ApprovalRequest;
import com.smartdocs.commandcenter.repository.ApprovalRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ApprovalService {

    private final ApprovalRequestRepository approvalRequestRepository;

    public List<ApprovalRequest> getAllApprovals() {
        return approvalRequestRepository.findAllByOrderByCreatedAtDesc();
    }

    public ApprovalRequest createApproval(ApprovalRequest approval) {
        approval.setId(null);
        if (approval.getCreatedAt() == null) {
            approval.setCreatedAt(Instant.now());
        }
        if (approval.getStatus() == null || approval.getStatus().isBlank()) {
            approval.setStatus("pending");
        }
        return approvalRequestRepository.save(approval);
    }

    public ApprovalRequest updateApproval(String id, Map<String, Object> updates) {
        ApprovalRequest approval = approvalRequestRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Approval not found: " + id));

        if (updates.containsKey("requestedBy")) approval.setRequestedBy((String) updates.get("requestedBy"));
        if (updates.containsKey("title")) approval.setTitle((String) updates.get("title"));
        if (updates.containsKey("category")) approval.setCategory((String) updates.get("category"));
        if (updates.containsKey("reason")) approval.setReason((String) updates.get("reason"));
        if (updates.containsKey("cost")) {
            Object cost = updates.get("cost");
            if (cost instanceof Number) approval.setCost(((Number) cost).doubleValue());
        }
        if (updates.containsKey("priority")) approval.setPriority((String) updates.get("priority"));
        if (updates.containsKey("status")) approval.setStatus((String) updates.get("status"));
        if (updates.containsKey("adminNote")) approval.setAdminNote((String) updates.get("adminNote"));

        return approvalRequestRepository.save(approval);
    }

    public ApprovalRequest decide(String id, Map<String, Object> decision) {
        ApprovalRequest approval = approvalRequestRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Approval not found: " + id));

        String status = (String) decision.get("status");
        String adminNote = (String) decision.get("adminNote");

        if (status == null || status.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status is required");
        }
        if (!status.equals("approved") && !status.equals("rejected")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status must be 'approved' or 'rejected'");
        }

        approval.setStatus(status);
        if (adminNote != null) approval.setAdminNote(adminNote);

        return approvalRequestRepository.save(approval);
    }
}
