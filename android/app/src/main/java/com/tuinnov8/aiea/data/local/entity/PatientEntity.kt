package com.tuinnov8.aiea.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import kotlinx.serialization.Serializable

@Entity(tableName = "patients")
@Serializable
data class PatientEntity(
    @PrimaryKey
    val id: String,
    val active: Boolean,
    val name: String,
    val gender: String,
    val birthDate: String,
    val status: String,
    val phone: String,
    val addressText: String,
    val chwId: String? = null,
    val chwName: String? = null,
    val updatedAt: String? = null,
    val nextFollowUpDate: String? = null,
    val syncStatus: SyncStatus = SyncStatus.SYNCED
)
