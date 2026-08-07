package com.tuinnov8.aiea.data.local.dao

import androidx.room.*
import com.tuinnov8.aiea.data.local.entity.EncounterEntity
import com.tuinnov8.aiea.data.local.entity.SyncStatus
import kotlinx.coroutines.flow.Flow

@Dao
interface EncounterDao {
    @Query("SELECT * FROM encounters WHERE patientId = :patientId ORDER BY date DESC")
    fun getEncountersByPatient(patientId: String): Flow<List<EncounterEntity>>

    @Query("SELECT * FROM encounters WHERE syncStatus = :syncStatus")
    suspend fun getEncountersBySyncStatus(syncStatus: SyncStatus): List<EncounterEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertEncounter(encounter: EncounterEntity)

    @Update
    suspend fun updateEncounter(encounter: EncounterEntity)

    @Query("UPDATE encounters SET syncStatus = :status WHERE id = :id")
    suspend fun updateSyncStatus(id: String, status: SyncStatus)

    @Query("SELECT COUNT(*) FROM encounters WHERE syncStatus = 'PENDING_UPLOAD'")
    fun getPendingSyncCount(): Flow<Int>
}
