package com.example.backend.model.message;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MessageRecipientRepository extends JpaRepository<MessageRecipient, Long> {

    @Query("SELECT mr FROM MessageRecipient mr " +
            "JOIN FETCH mr.message m " +
            "JOIN FETCH m.sender " +
            "WHERE mr.recipient.id = :userId " +
            "ORDER BY m.sentAt DESC")
    List<MessageRecipient> findAllByRecipientIdWithMessage(@Param("userId") Long userId);

    @Query("SELECT mr FROM MessageRecipient mr " +
            "JOIN FETCH mr.message m " +
            "WHERE mr.id = :id AND mr.recipient.id = :userId")
    Optional<MessageRecipient> findByIdAndRecipientId(@Param("id") Long id, @Param("userId") Long userId);

    @Modifying
    @Query("UPDATE MessageRecipient mr SET mr.isRead = true, mr.readAt = CURRENT_TIMESTAMP " +
            "WHERE mr.id = :id AND mr.recipient.id = :userId")
    int markAsRead(@Param("id") Long id, @Param("userId") Long userId);

    long countByRecipientIdAndIsReadFalse(@Param("userId") Long userId);

    @Query("SELECT mr FROM MessageRecipient mr " +
            "JOIN FETCH mr.message m " +
            "JOIN FETCH m.sender " +
            "WHERE m.sender.id = :senderId "
    )
    List<MessageRecipient> findAllBySenderIdInMessage(@Param("senderId") Long senderId);
}