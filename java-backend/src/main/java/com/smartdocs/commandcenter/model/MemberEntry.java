package com.smartdocs.commandcenter.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "member_entries")
public class MemberEntry {
    @Id
    private String id;
    private String memberName;
    private String sat;
    private String satTime;
    private String sun;
    private String sunTime;
    private String topics;
    private String focus;
    private boolean waitingOnRavi;
    private String waitingReason;
    private String priorityLevel;
    private String raviNotes;
    private Instant updatedAt;
}
