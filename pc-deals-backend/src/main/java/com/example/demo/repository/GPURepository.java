package com.example.demo.repository;

import com.example.demo.model.GPU;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface GPURepository extends JpaRepository<GPU, Long> {
    List<GPU> findByRedditPostId(String redditPostId);
    boolean existsByRedditPostId(String redditPostId);
} 