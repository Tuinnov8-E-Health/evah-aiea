package com.tuinnov8.aiea.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.tuinnov8.aiea.data.local.dao.EncounterDao
import com.tuinnov8.aiea.data.local.dao.PatientDao
import com.tuinnov8.aiea.data.local.entity.EncounterEntity
import com.tuinnov8.aiea.data.local.entity.PatientEntity

@Database(
    entities = [PatientEntity::class, EncounterEntity::class],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class AieaDatabase : RoomDatabase() {
    abstract fun patientDao(): PatientDao
    abstract fun encounterDao(): EncounterDao
}
