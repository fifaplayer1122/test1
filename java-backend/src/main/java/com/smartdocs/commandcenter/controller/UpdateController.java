package com.smartdocs.commandcenter.controller;

import com.smartdocs.commandcenter.model.TeamUpdate;
import com.smartdocs.commandcenter.service.UpdateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/updates")
@RequiredArgsConstructor
public class UpdateController {

    private final UpdateService updateService;

    @GetMapping
    public List<TeamUpdate> getAllUpdates() {
        return updateService.getAllUpdates();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TeamUpdate createUpdate(@RequestBody TeamUpdate update) {
        return updateService.createUpdate(update);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUpdate(@PathVariable String id) {
        updateService.deleteUpdate(id);
    }
}
