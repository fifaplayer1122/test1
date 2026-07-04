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
@Document(collection = "team_updates")
public class TeamUpdate {
    @Id
    private String id;
    private String memberName;
    private String content;
    private Instant createdAt;
}
