import React, { useState } from 'react';
import { Series } from '../types';
import SimpleSeriesCreationScreen from './SimpleSeriesCreationScreen';
import SeriesThumbnailSelectScreen from './SeriesThumbnailSelectScreen';
import { createSeries } from '../../../api/series/seriesActions';

interface SeriesCreationFlowProps {
  onBack: () => void;
  onSeriesCreated: (series: Series) => void;
}

type FlowStep = 'details' | 'thumbnail';

const SeriesCreationFlow: React.FC<SeriesCreationFlowProps> = ({
  onBack,
  onSeriesCreated
}) => {
  const [currentStep, setCurrentStep] = useState<FlowStep>('details');
  const [seriesData, setSeriesData] = useState<any>(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Handle series data from details screen
  const handleSeriesDataReady = (data: any) => {
    setSeriesData(data);
    setCurrentStep('thumbnail');
  };

  // Handle thumbnail selection
  const handleThumbnailSelected = (thumbnail: any | null) => {
    setSelectedThumbnail(thumbnail);
  };

  // Handle back navigation
  const handleBack = () => {
    if (currentStep === 'thumbnail') {
      setCurrentStep('details');
    } else {
      onBack();
    }
  };

  // Create series with or without thumbnail
  const handleCreateSeries = async () => {
    if (!seriesData) return;

    setIsCreating(true);

    try {
      // Prepare series data with thumbnail if selected
      const finalSeriesData = {
        ...seriesData,
        // Include thumbnail data if selected - backend will handle the upload
        ...(selectedThumbnail && { 
          poster: {
            uri: selectedThumbnail.uri,
            name: selectedThumbnail.fileName || `${seriesData.title}_poster.jpg`,
            type: selectedThumbnail.mimeType || 'image/jpeg',
          }
        }),
      };

      console.log('Creating series with data:', finalSeriesData);

      const result = await createSeries(finalSeriesData);
      console.log('API Response:', result);

      // Convert backend response to frontend Series format
      const newSeries: Series = {
        id: result.data._id,
        title: result.data.title,
        description: result.data.description,
        totalEpisodes: result.data.total_episodes || 0,
        accessType: result.data.type.toLowerCase() as 'free' | 'paid',
        price: result.data.price,
        launchDate: result.data.release_date || result.data.createdAt,
        totalViews: 0, // Not available in current API response
        totalEarnings: 0, // Not available in current API response
        episodes: [],
        createdAt: result.data.createdAt,
        updatedAt: result.data.updatedAt,
        posterUrl: result.data.posterUrl,
      };

      console.log('Series created successfully:', newSeries);
      setIsCreating(false);
      onSeriesCreated(newSeries);
    } catch (error) {
      console.error('Error creating series:', error);
      setIsCreating(false);
      // You might want to show an error message to the user here
    }
  };

  // Render current step
  if (currentStep === 'details') {
    return (
      <SimpleSeriesCreationScreen
        onBack={handleBack}
        onSeriesCreated={onSeriesCreated} // This won't be called in the new flow
        onThumbnailSelect={handleSeriesDataReady}
      />
    );
  }

  if (currentStep === 'thumbnail') {
    return (
      <SeriesThumbnailSelectScreen
        onThumbnailSelected={handleThumbnailSelected}
        onBack={handleBack}
        onContinue={handleCreateSeries}
        seriesTitle={seriesData?.title}
        isCreating={isCreating}
      />
    );
  }

  return null;
};

export default SeriesCreationFlow;