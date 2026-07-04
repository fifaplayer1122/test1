package com.smartdocs.commandcenter.repository;

import com.smartdocs.commandcenter.model.ApprovalRequest;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApprovalRequestRepository extends MongoRepository<ApprovalRequest, String> {
    List<ApprovalRequest> findAllByOrderByCreatedAtDesc();
}
