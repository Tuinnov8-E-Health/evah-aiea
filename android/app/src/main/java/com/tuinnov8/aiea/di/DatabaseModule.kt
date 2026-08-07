package com.tuinnov8.aiea.di

import android.content.Context
import androidx.room.Room
import com.tuinnov8.aiea.data.local.AieaDatabase
import com.tuinnov8.aiea.data.local.dao.EncounterDao
import com.tuinnov8.aiea.data.local.dao.PatientDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): AieaDatabase {
        return Room.databaseBuilder(
            context,
            AieaDatabase::class.java,
            "aiea_database"
        ).build()
    }

    @Provides
    fun providePatientDao(database: AieaDatabase): PatientDao {
        return database.patientDao()
    }

    @Provides
    fun provideEncounterDao(database: AieaDatabase): EncounterDao {
        return database.encounterDao()
    }
}
