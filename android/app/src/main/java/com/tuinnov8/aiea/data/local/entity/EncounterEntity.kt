package com.tuinnov8.aiea.data.local.entity

import androidx.room.Embedded
import androidx.room.Entity
import androidx.room.PrimaryKey
import kotlinx.serialization.Serializable

@Entity(tableName = "encounters")
@Serializable
data class EncounterEntity(
    @PrimaryKey
    val id: String,
    val status: String,
    val patientId: String,
    val date: String,
    val summary: String,
    val redFlags: List<String>,
    @Embedded(prefix = "rec_")
    val recommendation: RecommendationData,
    val type: String,
    val authorId: String,
    val authorName: String,
    val authorRole: String,
    val syncStatus: SyncStatus = SyncStatus.PENDING_UPLOAD
)

@Serializable
data class RecommendationData(
    val action: String,
    val urgencyLevel: String,
    val referralDestination: String? = null,
    val antiStigmaMessages: List<String>? = null,
    val safetyAdvice: List<String>? = null,
    val followUpPlan: String? = null
)
