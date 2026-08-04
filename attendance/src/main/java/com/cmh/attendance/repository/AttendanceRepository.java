package com.cmh.attendance.repository;

import com.cmh.attendance.entity.Attendance;
import com.cmh.attendance.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    Optional<Attendance> findByUserAndAttendanceDate(User user, LocalDate attendanceDate);

    List<Attendance> findByUserOrderByAttendanceDateDesc(User user);

    List<Attendance> findByAttendanceDateBetweenOrderByAttendanceDateDesc(LocalDate startDate, LocalDate endDate);

    @Query("SELECT a FROM Attendance a WHERE a.group.id = :groupId AND a.attendanceDate BETWEEN :startDate AND :endDate ORDER BY a.attendanceDate DESC")
    List<Attendance> findByGroupIdAndDateBetween(@Param("groupId") Long groupId,
                                                @Param("startDate") LocalDate startDate,
                                                @Param("endDate") LocalDate endDate);

    @Query("SELECT a FROM Attendance a WHERE a.attendanceDate = :date")
    List<Attendance> findByAttendanceDate(@Param("date") LocalDate date);
}
