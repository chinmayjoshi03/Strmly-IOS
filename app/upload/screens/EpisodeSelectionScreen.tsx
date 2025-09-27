import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Series } from '../../studio/types';
import { CONFIG } from '../../../Constants/config';
import { createSeries } from '../../../api/series/seriesActions';  // Add this import
import { useAuthStore } from '@/store/useAuthStore';


// ...existing code...

interface EpisodeSelectionScreenProps {
  onBack: () => void;
  onSeriesSelected: (series: Series) => void;
  onAddNewSeries: () => void;
  selectedSeries?: Series | null; // Pre-selected series when editing draft
}

/**
 * Episode Selection Screen
 * Shows existing series with their episodes and allows adding new episodes
 */
const EpisodeSelectionScreen: React.FC<EpisodeSelectionScreenProps> = ({
  onBack,
  onSeriesSelected,
  onAddNewSeries,
  selectedSeries
}) => {
  const [series, setSeries] = useState<Series[]>([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load series from API
  const loadSeries = async () => {
    setLoading(true);
    try {
      const { getUserSeries } = await import('../../../api/series/seriesActions');
      
      const response = await getUserSeries();
      console.log('Series data:', response);

      // Transform API response to match expected format
      const rawSeriesArray = response.data || [];
      const seriesData = Array.isArray(rawSeriesArray) ? rawSeriesArray.map(item => ({
        id: item._id,
        title: item.title,
        description: item.description,
        totalEpisodes: item.total_episodes || 0,
        accessType: (item.type === 'Paid' ? 'paid' : 'free') as 'paid' | 'free',
        price: item.price || 0,
        launchDate: item.release_date,
        totalViews: 0, // Not available in current API response
        totalEarnings: 0, // Not available in current API response
        episodes: item.episodes || [],
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      })) : [];

      setSeries(seriesData);
    } catch (error) {
      console.error('Error loading series:', error);
      setSeries([]);
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    loadSeries();
  }, []);

  // Set pre-selected series when available
  useEffect(() => {
    if (selectedSeries) {
      setSelectedSeriesId(selectedSeries.id);
    }
  }, [selectedSeries]);





  const handleSeriesPress = (seriesId: string) => {
    setSelectedSeriesId(seriesId);
  };

  const handleSelect = () => {
    const selectedSeries = series.find(s => s.id === selectedSeriesId);
    if (selectedSeries) {
      onSeriesSelected(selectedSeries);
    }
  };



  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading && series.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Episode</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Loading series...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Strmly studio</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Select your series</Text>



        <ScrollView style={styles.seriesList} showsVerticalScrollIndicator={false}>
          {series.map((seriesItem) => (
            <TouchableOpacity
              key={seriesItem.id}
              onPress={() => handleSeriesPress(seriesItem.id)}
              style={styles.seriesCard}
            >
              <LinearGradient
                colors={['#000000', '#0a0a0a', '#1a1a1a']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientCard}
              >
                <View style={styles.seriesIcon}>
                  <Image
                    source={require('../../../assets/episode.png')}
                    style={styles.episodeIcon}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.seriesInfo}>
                  <Text style={styles.seriesTitle}>{seriesItem.title || 'Untitled Series'}</Text>
                  <Text style={styles.seriesDetails}>
                    Total episode: {(seriesItem.totalEpisodes || 0).toString().padStart(2, '0')}     Access: {seriesItem.accessType === 'paid' ? `₹${seriesItem.price || 0}` : 'Free'}
                  </Text>
                  <Text style={styles.launchDate}>
                    Launch on {seriesItem.launchDate ? formatDate(seriesItem.launchDate) : 'No date'}
                  </Text>
                </View>
                <View style={styles.selectionIndicator}>
                  {selectedSeriesId === seriesItem.id ? (
                    <View style={styles.selectedDot} />
                  ) : (
                    <View style={styles.unselectedDot} />
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}

          {/* Empty State */}
          {series.length === 0 && !loading && (
            <View style={styles.emptyState}>
              <Ionicons name="folder-outline" size={64} color="#6B7280" />
              <Text style={styles.emptyTitle}>No series yet</Text>
              <Text style={styles.emptyDescription}>
                Create your first series to start adding episodes
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Bottom Button */}
      <View style={styles.bottomButton}>
        {selectedSeriesId && (
          <TouchableOpacity
            onPress={handleSelect}
            style={[styles.selectButton, { backgroundColor: '#3B82F6' }]}
          >
            <Text style={[styles.selectButtonText, { color: 'white' }]}>Continue</Text>
          </TouchableOpacity>
        )}
        {!selectedSeriesId && (
          <Text style={styles.emptyDescription}>
            Select a series to continue
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 48,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '500',
  },
  headerSpacer: {
    width: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 24,
  },
  seriesList: {
    flex: 1,
  },
  seriesCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  gradientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  seriesIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  episodeIcon: {
    width: 32,
    height: 32,
  },
  seriesInfo: {
    flex: 1,
  },
  seriesTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  seriesDetails: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 4,
  },
  launchDate: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  selectionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6B7280',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
  },
  unselectedDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    color: '#9CA3AF',
    fontSize: 18,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  bottomButton: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 16,
    marginBottom: 25, // Increased to account for nav bar
  },
  selectButton: {
    backgroundColor: '#E5E7EB',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
  },
  selectButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 16,
  },
});

export default EpisodeSelectionScreen;