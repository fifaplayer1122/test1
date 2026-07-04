package com.smartdocs.commandcenter.repository;

import com.smartdocs.commandcenter.model.MemberPriority;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MemberPriorityRepository extends MongoRepository<MemberPriority, String> {
    List<MemberPriority> findAllByOrderByCreatedAtAsc();
}
