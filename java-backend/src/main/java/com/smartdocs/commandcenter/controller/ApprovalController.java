package com.smartdocs.commandcenter.controller;

import com.smartdocs.commandcenter.model.ApprovalRequest;
import com.smartdocs.commandcenter.service.ApprovalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/approvals")
@RequiredArgsConstructor
public class ApprovalController {

    private final ApprovalService approvalService;

    @GetMapping
    public List<ApprovalRequest> getAllApprovals() {
        return approvalService.getAllApprovals();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApprovalRequest createApproval(@RequestBody ApprovalRequest approval) {
        return approvalService.createApproval(approval);
    }

    @PutMapping("/{id}")
    public ApprovalRequest updateApproval(@PathVariable String id, @RequestBody Map<String, Object> updates) {
        return approvalService.updateApproval(id, updates);
    }

    @PatchMapping("/{id}/decide")
    public ApprovalRequest decide(@PathVariable String id, @RequestBody Map<String, Object> decision) {
        return approvalService.decide(id, decision);
    }
}
