package com.smartdocs.commandcenter;

import com.smartdocs.commandcenter.model.Member;
import com.smartdocs.commandcenter.model.MemberPriority;
import com.smartdocs.commandcenter.model.Task;
import com.smartdocs.commandcenter.repository.MemberPriorityRepository;
import com.smartdocs.commandcenter.repository.MemberRepository;
import com.smartdocs.commandcenter.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final TaskRepository taskRepository;
    private final MemberRepository memberRepository;
    private final MemberPriorityRepository memberPriorityRepository;

    @Override
    public void run(String... args) {
        seedTasks();
        seedMembers();
        seedPriorities();
    }

    private void seedTasks() {
        if (taskRepository.count() > 0) {
            log.info("Tasks collection already seeded, skipping.");
            return;
        }
        log.info("Seeding tasks...");

        List<Task> tasks = List.of(
            // --- TODO ---
            Task.builder()
                .title("IBTTA Annual Meeting - Submit Call for Presentations")
                .priority("very_high")
                .status("todo")
                .eta("2026-07-10")
                .notes("July 10th Deadline")
                .createdAt(Instant.now())
                .build(),
            Task.builder()
                .title("Cancel LinkedIn Premium (personal + company)")
                .priority("very_high")
                .status("todo")
                .eta("2026-07-05")
                .notes("2 weeks deadline")
                .createdAt(Instant.now())
                .build(),
            Task.builder()
                .title("Need to visit office daily to check for mail")
                .priority("very_high")
                .status("todo")
                .notes("Check daily")
                .createdAt(Instant.now())
                .build(),
            Task.builder()
                .title("NIGP event - backdrop, table, flyers, swag")
                .priority("very_high")
                .status("todo")
                .eta("2026-07-25")
                .notes("Conference Aug 23-26, Exhibit Aug 23-24, 2026")
                .createdAt(Instant.now())
                .build(),
            Task.builder()
                .title("Messaging of Maintenance IBTTA Conference")
                .priority("high")
                .status("todo")
                .notes("Being worked on")
                .createdAt(Instant.now())
                .build(),
            Task.builder()
                .title("Apple Developer - confirm organization address change")
                .priority("high")
                .status("todo")
                .createdAt(Instant.now())
                .build(),
            Task.builder()
                .title("Cancel OFAC API subscription")
                .priority("high")
                .status("todo")
                .createdAt(Instant.now())
                .build(),
            Task.builder()
                .title("FL Registration is rejected, need to fix")
                .priority("high")
                .status("todo")
                .eta("2026-07-15")
                .createdAt(Instant.now())
                .build(),
            Task.builder()
                .title("Sign up for Nacha partnership")
                .priority("high")
                .status("todo")
                .createdAt(Instant.now())
                .build(),
            Task.builder()
                .title("Signup for ESRI partnership")
                .priority("high")
                .status("todo")
                .createdAt(Instant.now())
                .build(),
            Task.builder()
                .title("Post weekly on leadership channel (at least 1/week)")
                .priority("medium")
                .status("todo")
                .notes("Repeated task")
                .createdAt(Instant.now())
                .build(),
            Task.builder()
                .title("Post 2-3 times weekly on notebook channel")
                .priority("medium")
                .status("todo")
                .notes("Repeated task")
                .createdAt(Instant.now())
                .build(),
            Task.builder()
                .title("Adobe $21.19 charge - review and action")
                .priority("medium")
                .status("todo")
                .createdAt(Instant.now())
                .build(),
            Task.builder()
                .title("NIGP Exhibitor Hub - August Summit registration (initial info added)")
                .priority("medium")
                .status("todo")
                .createdAt(Instant.now())
                .build(),
            Task.builder()
                .title("Register for APPA September Summit")
                .priority("medium")
                .status("todo")
                .createdAt(Instant.now())
                .build(),
            Task.builder()
                .title("Need to order Visiting Card for Tod")
                .priority("medium")
                .status("todo")
                .eta("2026-07-14")
                .notes("Already kept in Staples")
                .createdAt(Instant.now())
                .build(),
            Task.builder()
                .title("Order dot.Cards - dotcards.net/products/black-card")
                .priority("medium")
                .status("todo")
                .createdAt(Instant.now())
                .build(),

            // --- DONE ---
            Task.builder()
                .title("To book a handyman for New Orleans booth build up")
                .priority("very_high")
                .status("done")
                .notes("Soon to be sorted")
                .createdAt(Instant.now())
                .build(),
            Task.builder()
                .title("IBTTA Maintenance Workshop (New Orleans) - Order table + ship by today")
                .priority("very_high")
                .status("done")
                .notes("Working on")
                .createdAt(Instant.now())
                .build(),
            Task.builder()
                .title("IBTTA Annual Meeting Exhibit Sales Open on Tuesday (Sneak Preview Available Now!)")
                .priority("very_high")
                .status("done")
                .notes("Need to remind")
                .createdAt(Instant.now())
                .build(),
            Task.builder()
                .title("To talk to Sai Pranav on his last working day")
                .priority("very_high")
                .status("done")
                .createdAt(Instant.now())
                .build(),
            Task.builder()
                .title("To decide on Jyothi extension")
                .priority("very_high")
                .status("done")
                .createdAt(Instant.now())
                .build(),
            Task.builder()
                .title("US Visa Documents for Raghu")
                .priority("high")
                .status("done")
                .notes("Being worked on")
                .createdAt(Instant.now())
                .build(),
            Task.builder()
                .title("Merchology shirts - check arrival")
                .priority("high")
                .status("done")
                .createdAt(Instant.now())
                .build(),
            Task.builder()
                .title("Register SmartDocs in Tennessee and Georgia")
                .priority("high")
                .status("done")
                .createdAt(Instant.now())
                .build(),
            Task.builder()
                .title("Get COI for JEA")
                .priority("high")
                .status("done")
                .createdAt(Instant.now())
                .build(),
            Task.builder()
                .title("SWAGS - order Touchscreen cleaner, Electronic cleaner, dot.card")
                .priority("medium")
                .status("done")
                .createdAt(Instant.now())
                .build(),

            // --- SKIP ---
            Task.builder()
                .title("Harvard Medical School AI certificate program - register")
                .priority("medium")
                .status("skip")
                .createdAt(Instant.now())
                .build()
        );

        taskRepository.saveAll(tasks);
        log.info("Seeded {} tasks.", tasks.size());
    }

    private void seedMembers() {
        if (memberRepository.count() > 0) {
            log.info("Members collection already seeded, skipping.");
            return;
        }
        log.info("Seeding members...");

        List<String> names = List.of(
            "Aditya Simhadri",
            "Janvi",
            "Pooja",
            "Ramakrishna",
            "Sai Charan",
            "Sai Varma",
            "Sunil",
            "Pranesh",
            "Hitesh",
            "Vibha",
            "Raghu"
        );

        for (int i = 0; i < names.size(); i++) {
            memberRepository.save(Member.builder()
                .name(names.get(i))
                .sortOrder(i)
                .build());
        }
        log.info("Seeded {} members.", names.size());
    }

    private void seedPriorities() {
        if (memberPriorityRepository.count() > 0) {
            log.info("Member priorities collection already seeded, skipping.");
            return;
        }
        log.info("Seeding member priorities...");

        List<MemberPriority> priorities = List.of(
            // Pranesh
            MemberPriority.builder()
                .memberName("Pranesh")
                .title("CLM competitive positioning vs Coupa & Tonkea — draft response doc")
                .priorityLevel("very_high")
                .createdAt(Instant.now())
                .build(),
            MemberPriority.builder()
                .memberName("Pranesh")
                .title("Dual-track pitch framework (standalone CLM vs platform)")
                .priorityLevel("high")
                .createdAt(Instant.now())
                .build(),

            // Sai Charan
            MemberPriority.builder()
                .memberName("Sai Charan")
                .title("Website redesign — homepage hero + product pages")
                .priorityLevel("high")
                .createdAt(Instant.now())
                .build(),
            MemberPriority.builder()
                .memberName("Sai Charan")
                .title("Mobile responsiveness audit across all landing pages")
                .priorityLevel("medium")
                .createdAt(Instant.now())
                .build(),

            // Aditya Simhadri
            MemberPriority.builder()
                .memberName("Aditya Simhadri")
                .title("RFI response for Publix — compliance & data residency section")
                .priorityLevel("high")
                .createdAt(Instant.now())
                .build(),
            MemberPriority.builder()
                .memberName("Aditya Simhadri")
                .title("Customer onboarding checklist for Q3 enterprise deals")
                .priorityLevel("medium")
                .createdAt(Instant.now())
                .build(),

            // Janvi
            MemberPriority.builder()
                .memberName("Janvi")
                .title("User research synthesis — onboarding drop-off root cause")
                .priorityLevel("very_high")
                .createdAt(Instant.now())
                .build(),
            MemberPriority.builder()
                .memberName("Janvi")
                .title("Q3 success metrics dashboard — churn cohort definition sign-off")
                .priorityLevel("high")
                .createdAt(Instant.now())
                .build(),

            // Sunil
            MemberPriority.builder()
                .memberName("Sunil")
                .title("Fix API rate limit bug on bulk export (root cause found)")
                .priorityLevel("very_high")
                .createdAt(Instant.now())
                .build(),
            MemberPriority.builder()
                .memberName("Sunil")
                .title("Tech debt: migrate auth service to new token format")
                .priorityLevel("medium")
                .createdAt(Instant.now())
                .build(),

            // Vibha
            MemberPriority.builder()
                .memberName("Vibha")
                .title("Brand refresh copy — homepage, product pages & case studies")
                .priorityLevel("high")
                .createdAt(Instant.now())
                .build(),

            // Hitesh
            MemberPriority.builder()
                .memberName("Hitesh")
                .title("Enterprise SSO rollout — Okta SAML fallback for 2 pilot customers")
                .priorityLevel("very_high")
                .createdAt(Instant.now())
                .build(),
            MemberPriority.builder()
                .memberName("Hitesh")
                .title("Support escalation playbook for enterprise tier")
                .priorityLevel("medium")
                .createdAt(Instant.now())
                .build(),

            // Raghu
            MemberPriority.builder()
                .memberName("Raghu")
                .title("Data pipeline optimisation — nightly sync from 4.2h → 58min done")
                .priorityLevel("high")
                .createdAt(Instant.now())
                .build(),
            MemberPriority.builder()
                .memberName("Raghu")
                .title("Document pipeline approach and hand off to Sunil")
                .priorityLevel("low")
                .createdAt(Instant.now())
                .build(),

            // Pooja
            MemberPriority.builder()
                .memberName("Pooja")
                .title("Legal review of updated MSA template for US customers")
                .priorityLevel("high")
                .createdAt(Instant.now())
                .build(),

            // Ramakrishna
            MemberPriority.builder()
                .memberName("Ramakrishna")
                .title("DevOps: set up staging environment parity with prod")
                .priorityLevel("medium")
                .createdAt(Instant.now())
                .build(),

            // Sai Varma
            MemberPriority.builder()
                .memberName("Sai Varma")
                .title("Integrate Stripe billing for self-serve plan upgrades")
                .priorityLevel("high")
                .createdAt(Instant.now())
                .build()
        );

        memberPriorityRepository.saveAll(priorities);
        log.info("Seeded {} member priorities.", priorities.size());
    }
}
