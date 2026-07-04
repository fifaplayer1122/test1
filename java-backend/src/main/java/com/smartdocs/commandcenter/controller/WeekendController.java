package com.smartdocs.commandcenter.controller;

import com.smartdocs.commandcenter.model.MemberEntry;
import com.smartdocs.commandcenter.service.WeekendService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/weekend")
@RequiredArgsConstructor
public class WeekendController {

    private final WeekendService weekendService;

    @GetMapping
    public Map<String, Object> getWeekendData() {
        return weekendService.getWeekendData();
    }

    @PutMapping("/{memberName}")
    public MemberEntry upsertEntry(@PathVariable String memberName, @RequestBody Map<String, Object> fields) {
        return weekendService.upsertEntry(memberName, fields);
    }
}
