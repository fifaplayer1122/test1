package com.smartdocs.commandcenter.service;

import com.smartdocs.commandcenter.model.Task;
import com.smartdocs.commandcenter.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;

    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }

    public Task createTask(Task task) {
        task.setId(null);
        if (task.getCreatedAt() == null) {
            task.setCreatedAt(Instant.now());
        }
        if (task.getStatus() == null || task.getStatus().isBlank()) {
            task.setStatus("todo");
        }
        return taskRepository.save(task);
    }

    public Task updateTask(String id, Map<String, Object> updates) {
        Task task = taskRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found: " + id));

        if (updates.containsKey("title")) task.setTitle((String) updates.get("title"));
        if (updates.containsKey("priority")) task.setPriority((String) updates.get("priority"));
        if (updates.containsKey("notes")) task.setNotes((String) updates.get("notes"));
        if (updates.containsKey("eta")) task.setEta((String) updates.get("eta"));
        if (updates.containsKey("status")) task.setStatus((String) updates.get("status"));

        return taskRepository.save(task);
    }

    public void deleteTask(String id) {
        if (!taskRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found: " + id);
        }
        taskRepository.deleteById(id);
    }
}
