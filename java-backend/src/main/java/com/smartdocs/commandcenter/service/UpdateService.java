package com.smartdocs.commandcenter.service;

import com.smartdocs.commandcenter.model.TeamUpdate;
import com.smartdocs.commandcenter.repository.TeamUpdateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UpdateService {

    private final TeamUpdateRepository teamUpdateRepository;

    public List<TeamUpdate> getAllUpdates() {
        return teamUpdateRepository.findAllByOrderByCreatedAtDesc();
    }

    public TeamUpdate createUpdate(TeamUpdate update) {
        update.setId(null);
        if (update.getCreatedAt() == null) {
            update.setCreatedAt(Instant.now());
        }
        return teamUpdateRepository.save(update);
    }

    public void deleteUpdate(String id) {
        if (!teamUpdateRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Update not found: " + id);
        }
        teamUpdateRepository.deleteById(id);
    }
}
