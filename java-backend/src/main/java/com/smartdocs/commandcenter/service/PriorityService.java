package com.smartdocs.commandcenter.service;

import com.smartdocs.commandcenter.model.MemberPriority;
import com.smartdocs.commandcenter.repository.MemberPriorityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PriorityService {

    private final MemberPriorityRepository memberPriorityRepository;

    public List<MemberPriority> getAllPriorities() {
        return memberPriorityRepository.findAllByOrderByCreatedAtAsc();
    }

    public MemberPriority createPriority(MemberPriority priority) {
        priority.setId(null);
        if (priority.getCreatedAt() == null) {
            priority.setCreatedAt(Instant.now());
        }
        return memberPriorityRepository.save(priority);
    }

    public MemberPriority updatePriority(String id, Map<String, Object> updates) {
        MemberPriority priority = memberPriorityRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Priority not found: " + id));

        if (updates.containsKey("memberName")) priority.setMemberName((String) updates.get("memberName"));
        if (updates.containsKey("title")) priority.setTitle((String) updates.get("title"));
        if (updates.containsKey("priorityLevel")) priority.setPriorityLevel((String) updates.get("priorityLevel"));

        return memberPriorityRepository.save(priority);
    }

    public void deletePriority(String id) {
        if (!memberPriorityRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Priority not found: " + id);
        }
        memberPriorityRepository.deleteById(id);
    }
}
