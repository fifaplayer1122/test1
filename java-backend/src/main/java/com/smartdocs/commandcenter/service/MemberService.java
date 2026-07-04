package com.smartdocs.commandcenter.service;

import com.smartdocs.commandcenter.model.Member;
import com.smartdocs.commandcenter.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository memberRepository;

    public List<Member> getAllMembers() {
        return memberRepository.findAll();
    }

    public Member createMember(Member member) {
        member.setId(null);
        return memberRepository.save(member);
    }

    public void deleteMemberByName(String name) {
        Member member = memberRepository.findByName(name)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found: " + name));
        memberRepository.delete(member);
    }
}
