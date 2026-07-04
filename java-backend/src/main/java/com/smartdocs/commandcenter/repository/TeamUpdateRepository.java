package com.smartdocs.commandcenter.repository;

import com.smartdocs.commandcenter.model.TeamUpdate;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeamUpdateRepository extends MongoRepository<TeamUpdate, String> {
    List<TeamUpdate> findAllByOrderByCreatedAtDesc();
}
