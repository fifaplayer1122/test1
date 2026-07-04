package com.smartdocs.commandcenter.controller;

import com.smartdocs.commandcenter.model.MemberPriority;
import com.smartdocs.commandcenter.service.PriorityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/priorities")
@RequiredArgsConstructor
public class PriorityController {

    private final PriorityService priorityService;

    @GetMapping
    public List<MemberPriority> getAllPriorities() {
        return priorityService.getAllPriorities();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MemberPriority createPriority(@RequestBody MemberPriority priority) {
        return priorityService.createPriority(priority);
    }

    @PutMapping("/{id}")
    public MemberPriority updatePriority(@PathVariable String id, @RequestBody Map<String, Object> updates) {
        return priorityService.updatePriority(id, updates);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePriority(@PathVariable String id) {
        priorityService.deletePriority(id);
    }
}
