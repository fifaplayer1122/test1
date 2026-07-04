package com.smartdocs.commandcenter.service;

import com.smartdocs.commandcenter.model.Member;
import com.smartdocs.commandcenter.model.MemberEntry;
import com.smartdocs.commandcenter.repository.MemberEntryRepository;
import com.smartdocs.commandcenter.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WeekendService {

    private final MemberRepository memberRepository;
    private final MemberEntryRepository memberEntryRepository;

    public Map<String, Object> getWeekendData() {
        List<String> memberNames = memberRepository.findAll()
            .stream()
            .sorted(java.util.Comparator.comparingInt(Member::getSortOrder))
            .map(Member::getName)
            .collect(Collectors.toList());

        List<MemberEntry> entries = memberEntryRepository.findAll();
        Map<String, MemberEntry> entriesByName = entries.stream()
            .collect(Collectors.toMap(MemberEntry::getMemberName, e -> e, (a, b) -> a));

        Map<String, Object> result = new HashMap<>();
        result.put("members", memberNames);
        result.put("entries", entriesByName);
        return result;
    }

    public MemberEntry upsertEntry(String memberName, Map<String, Object> fields) {
        MemberEntry entry = memberEntryRepository.findByMemberName(memberName)
            .orElseGet(() -> MemberEntry.builder().memberName(memberName).build());

        if (fields.containsKey("sat")) entry.setSat((String) fields.get("sat"));
        if (fields.containsKey("satTime")) entry.setSatTime((String) fields.get("satTime"));
        if (fields.containsKey("sun")) entry.setSun((String) fields.get("sun"));
        if (fields.containsKey("sunTime")) entry.setSunTime((String) fields.get("sunTime"));
        if (fields.containsKey("topics")) entry.setTopics((String) fields.get("topics"));
        if (fields.containsKey("focus")) entry.setFocus((String) fields.get("focus"));
        if (fields.containsKey("waitingOnRavi")) {
            Object val = fields.get("waitingOnRavi");
            if (val instanceof Boolean) {
                entry.setWaitingOnRavi((Boolean) val);
            } else {
                entry.setWaitingOnRavi(Boolean.parseBoolean(val.toString()));
            }
        }
        if (fields.containsKey("waitingReason")) entry.setWaitingReason((String) fields.get("waitingReason"));
        if (fields.containsKey("priorityLevel")) entry.setPriorityLevel((String) fields.get("priorityLevel"));
        if (fields.containsKey("raviNotes")) entry.setRaviNotes((String) fields.get("raviNotes"));
        entry.setUpdatedAt(Instant.now());

        return memberEntryRepository.save(entry);
    }
}
