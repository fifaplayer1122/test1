package com.smartdocs.commandcenter.repository;

import com.smartdocs.commandcenter.model.MemberEntry;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MemberEntryRepository extends MongoRepository<MemberEntry, String> {
    Optional<MemberEntry> findByMemberName(String memberName);
}
