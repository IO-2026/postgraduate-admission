package com.example.backend.model.message;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    @Query("SELECT m FROM Message m JOIN FETCH m.sender WHERE m.id IN :ids")
    List<Message> findAllWithSenderByIds(@Param("ids") List<Long> ids);
}