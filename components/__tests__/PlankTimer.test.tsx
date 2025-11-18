import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PlankTimer from '../PlankTimer';
import * as timerLogic from '@/utils/timerLogic';

// Mock modules
jest.mock('../VideoRecorder', () => {
  return function MockVideoRecorder({ onComplete, onError, detectionMode }: any) {
    return (
      <div data-testid="video-recorder">
        <div>Detection Mode: {detectionMode ? 'Yes' : 'No'}</div>
        <button onClick={onComplete}>Complete</button>
        <button onClick={() => onError('Test error')}>Trigger Error</button>
      </div>
    );
  };
});

jest.mock('../RestDay', () => {
  return function MockRestDay() {
    return <div data-testid="rest-day">Rest Day Component</div>;
  };
});

describe('PlankTimer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial render', () => {
    it('should render idle state on start', () => {
      jest.spyOn(timerLogic, 'calculateTargetDuration').mockReturnValue(30);
      jest.spyOn(timerLogic, 'getDayNumber').mockReturnValue(1);
      jest.spyOn(timerLogic, 'formatDuration').mockReturnValue('00:30');

      render(<PlankTimer />);

      expect(screen.getByText('Plank Timer')).toBeInTheDocument();
      expect(screen.getByText('Day 1 Challenge')).toBeInTheDocument();
      expect(screen.getByText("Today's Goal")).toBeInTheDocument();
      expect(screen.getByText('00:30')).toBeInTheDocument();
    });

    it('should display correct day number', () => {
      jest.spyOn(timerLogic, 'calculateTargetDuration').mockReturnValue(42);
      jest.spyOn(timerLogic, 'getDayNumber').mockReturnValue(3);
      jest.spyOn(timerLogic, 'formatDuration').mockReturnValue('00:42');

      render(<PlankTimer />);

      expect(screen.getByText('Day 3 Challenge')).toBeInTheDocument();
      expect(screen.getByText('00:42')).toBeInTheDocument();
    });

    it('should display start recording button', () => {
      jest.spyOn(timerLogic, 'calculateTargetDuration').mockReturnValue(30);
      jest.spyOn(timerLogic, 'getDayNumber').mockReturnValue(1);

      render(<PlankTimer />);

      const startButton = screen.getByRole('button', { name: /Start Recording/i });
      expect(startButton).toBeInTheDocument();
    });

    it('should render rest day component on Sunday', () => {
      jest.spyOn(timerLogic, 'calculateTargetDuration').mockReturnValue(null);

      render(<PlankTimer />);

      expect(screen.getByTestId('rest-day')).toBeInTheDocument();
    });
  });

  describe('detection mode toggle', () => {
    it('should show detection mode toggle', () => {
      jest.spyOn(timerLogic, 'calculateTargetDuration').mockReturnValue(30);
      jest.spyOn(timerLogic, 'getDayNumber').mockReturnValue(1);

      render(<PlankTimer />);

      expect(screen.getByText('Auto-Detection Mode')).toBeInTheDocument();
      expect(screen.getByText(/Timer starts when you get into plank/i)).toBeInTheDocument();
    });

    it('should toggle detection mode when checkbox clicked', () => {
      jest.spyOn(timerLogic, 'calculateTargetDuration').mockReturnValue(30);
      jest.spyOn(timerLogic, 'getDayNumber').mockReturnValue(1);

      render(<PlankTimer />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();

      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();

      fireEvent.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    it('should change button text when detection mode enabled', () => {
      jest.spyOn(timerLogic, 'calculateTargetDuration').mockReturnValue(30);
      jest.spyOn(timerLogic, 'getDayNumber').mockReturnValue(1);

      render(<PlankTimer />);

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(screen.getByRole('button', { name: /Start Detection Mode/i })).toBeInTheDocument();
    });
  });

  describe('state transitions', () => {
    it('should transition to recording state when start clicked', () => {
      jest.spyOn(timerLogic, 'calculateTargetDuration').mockReturnValue(30);
      jest.spyOn(timerLogic, 'getDayNumber').mockReturnValue(1);

      render(<PlankTimer />);

      const startButton = screen.getByRole('button', { name: /Start Recording/i });
      fireEvent.click(startButton);

      expect(screen.getByTestId('video-recorder')).toBeInTheDocument();
    });

    it('should pass detection mode to VideoRecorder', () => {
      jest.spyOn(timerLogic, 'calculateTargetDuration').mockReturnValue(30);
      jest.spyOn(timerLogic, 'getDayNumber').mockReturnValue(1);

      render(<PlankTimer />);

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      const startButton = screen.getByRole('button', { name: /Start Detection Mode/i });
      fireEvent.click(startButton);

      expect(screen.getByText('Detection Mode: Yes')).toBeInTheDocument();
    });

    it('should transition to completed state when recording completes', async () => {
      jest.spyOn(timerLogic, 'calculateTargetDuration').mockReturnValue(30);
      jest.spyOn(timerLogic, 'getDayNumber').mockReturnValue(1);
      jest.spyOn(timerLogic, 'formatDuration').mockReturnValue('00:30');

      render(<PlankTimer />);

      const startButton = screen.getByRole('button', { name: /Start Recording/i });
      fireEvent.click(startButton);

      const completeButton = screen.getByRole('button', { name: /Complete/i });
      fireEvent.click(completeButton);

      await waitFor(() => {
        expect(screen.getByText('Congratulations!')).toBeInTheDocument();
      });
    });

    it('should show completed state UI', async () => {
      jest.spyOn(timerLogic, 'calculateTargetDuration').mockReturnValue(30);
      jest.spyOn(timerLogic, 'getDayNumber').mockReturnValue(2);
      jest.spyOn(timerLogic, 'formatDuration').mockReturnValue('00:30');

      render(<PlankTimer />);

      const startButton = screen.getByRole('button', { name: /Start Recording/i });
      fireEvent.click(startButton);

      const completeButton = screen.getByRole('button', { name: /Complete/i });
      fireEvent.click(completeButton);

      await waitFor(() => {
        expect(screen.getByText('Congratulations!')).toBeInTheDocument();
        expect(screen.getByText('Day 2 Complete')).toBeInTheDocument();
        expect(screen.getByText(/You held your plank for/i)).toBeInTheDocument();
      });
    });
  });

  describe('error handling', () => {
    it('should display error message when recording fails', () => {
      jest.spyOn(timerLogic, 'calculateTargetDuration').mockReturnValue(30);
      jest.spyOn(timerLogic, 'getDayNumber').mockReturnValue(1);

      render(<PlankTimer />);

      const startButton = screen.getByRole('button', { name: /Start Recording/i });
      fireEvent.click(startButton);

      const errorButton = screen.getByRole('button', { name: /Trigger Error/i });
      fireEvent.click(errorButton);

      expect(screen.getByText('Test error')).toBeInTheDocument();
    });

    it('should return to idle state on error', () => {
      jest.spyOn(timerLogic, 'calculateTargetDuration').mockReturnValue(30);
      jest.spyOn(timerLogic, 'getDayNumber').mockReturnValue(1);

      render(<PlankTimer />);

      const startButton = screen.getByRole('button', { name: /Start Recording/i });
      fireEvent.click(startButton);

      const errorButton = screen.getByRole('button', { name: /Trigger Error/i });
      fireEvent.click(errorButton);

      expect(screen.getByText("Today's Goal")).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Start Recording/i })).toBeInTheDocument();
    });

    it('should clear error when starting new recording', () => {
      jest.spyOn(timerLogic, 'calculateTargetDuration').mockReturnValue(30);
      jest.spyOn(timerLogic, 'getDayNumber').mockReturnValue(1);

      render(<PlankTimer />);

      const startButton = screen.getByRole('button', { name: /Start Recording/i });
      fireEvent.click(startButton);

      const errorButton = screen.getByRole('button', { name: /Trigger Error/i });
      fireEvent.click(errorButton);

      expect(screen.getByText('Test error')).toBeInTheDocument();

      const newStartButton = screen.getByRole('button', { name: /Start Recording/i });
      fireEvent.click(newStartButton);

      expect(screen.queryByText('Test error')).not.toBeInTheDocument();
    });
  });

  describe('reset functionality', () => {
    it('should reset to idle state from completed', async () => {
      jest.spyOn(timerLogic, 'calculateTargetDuration').mockReturnValue(30);
      jest.spyOn(timerLogic, 'getDayNumber').mockReturnValue(1);
      jest.spyOn(timerLogic, 'formatDuration').mockReturnValue('00:30');

      render(<PlankTimer />);

      const startButton = screen.getByRole('button', { name: /Start Recording/i });
      fireEvent.click(startButton);

      const completeButton = screen.getByRole('button', { name: /Complete/i });
      fireEvent.click(completeButton);

      await waitFor(() => {
        expect(screen.getByText('Congratulations!')).toBeInTheDocument();
      });

      const recordAnotherButton = screen.getByRole('button', { name: /Record Another/i });
      fireEvent.click(recordAnotherButton);

      expect(screen.getByText("Today's Goal")).toBeInTheDocument();
    });
  });

  describe('Discord link', () => {
    it('should display Discord link in idle state', () => {
      jest.spyOn(timerLogic, 'calculateTargetDuration').mockReturnValue(30);
      jest.spyOn(timerLogic, 'getDayNumber').mockReturnValue(1);

      render(<PlankTimer />);

      const discordLinks = screen.getAllByText(/Plank-Challenge Discord/i);
      expect(discordLinks.length).toBeGreaterThan(0);
    });

    it('should display Discord link in completed state', async () => {
      jest.spyOn(timerLogic, 'calculateTargetDuration').mockReturnValue(30);
      jest.spyOn(timerLogic, 'getDayNumber').mockReturnValue(1);
      jest.spyOn(timerLogic, 'formatDuration').mockReturnValue('00:30');

      render(<PlankTimer />);

      const startButton = screen.getByRole('button', { name: /Start Recording/i });
      fireEvent.click(startButton);

      const completeButton = screen.getByRole('button', { name: /Complete/i });
      fireEvent.click(completeButton);

      await waitFor(() => {
        expect(screen.getByText('Congratulations!')).toBeInTheDocument();
      });

      const discordLinks = screen.getAllByText(/Plank-Challenge Discord/i);
      expect(discordLinks.length).toBeGreaterThan(0);
    });

    it('should have correct href for Discord link', () => {
      jest.spyOn(timerLogic, 'calculateTargetDuration').mockReturnValue(30);
      jest.spyOn(timerLogic, 'getDayNumber').mockReturnValue(1);

      render(<PlankTimer />);

      const discordLink = screen.getAllByRole('link', {
        name: /Plank-Challenge Discord/i,
      })[0];

      expect(discordLink).toHaveAttribute('target', '_blank');
      expect(discordLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('UI elements', () => {
    it('should display tip in idle state', () => {
      jest.spyOn(timerLogic, 'calculateTargetDuration').mockReturnValue(30);
      jest.spyOn(timerLogic, 'getDayNumber').mockReturnValue(1);

      render(<PlankTimer />);

      expect(
        screen.getByText(/Position your device so the camera can see your plank form/i)
      ).toBeInTheDocument();
    });

    it('should display success icon in completed state', async () => {
      jest.spyOn(timerLogic, 'calculateTargetDuration').mockReturnValue(30);
      jest.spyOn(timerLogic, 'getDayNumber').mockReturnValue(1);
      jest.spyOn(timerLogic, 'formatDuration').mockReturnValue('00:30');

      render(<PlankTimer />);

      const startButton = screen.getByRole('button', { name: /Start Recording/i });
      fireEvent.click(startButton);

      const completeButton = screen.getByRole('button', { name: /Complete/i });
      fireEvent.click(completeButton);

      await waitFor(() => {
        expect(screen.getByText('Congratulations!')).toBeInTheDocument();
      });

      // Check for success message
      expect(screen.getByText(/Your video has been downloaded automatically/i)).toBeInTheDocument();
    });

    it('should show share section in completed state', async () => {
      jest.spyOn(timerLogic, 'calculateTargetDuration').mockReturnValue(30);
      jest.spyOn(timerLogic, 'getDayNumber').mockReturnValue(1);
      jest.spyOn(timerLogic, 'formatDuration').mockReturnValue('00:30');

      render(<PlankTimer />);

      const startButton = screen.getByRole('button', { name: /Start Recording/i });
      fireEvent.click(startButton);

      const completeButton = screen.getByRole('button', { name: /Complete/i });
      fireEvent.click(completeButton);

      await waitFor(() => {
        expect(screen.getByText('Share your progress!')).toBeInTheDocument();
      });
    });
  });

  describe('accessibility', () => {
    it('should have proper heading structure', () => {
      jest.spyOn(timerLogic, 'calculateTargetDuration').mockReturnValue(30);
      jest.spyOn(timerLogic, 'getDayNumber').mockReturnValue(1);

      render(<PlankTimer />);

      expect(screen.getByRole('heading', { name: /Plank Timer/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Today's Goal/i })).toBeInTheDocument();
    });

    it('should have accessible buttons', () => {
      jest.spyOn(timerLogic, 'calculateTargetDuration').mockReturnValue(30);
      jest.spyOn(timerLogic, 'getDayNumber').mockReturnValue(1);

      render(<PlankTimer />);

      const startButton = screen.getByRole('button', { name: /Start Recording/i });
      expect(startButton).toBeEnabled();
    });

    it('should have accessible checkbox with label', () => {
      jest.spyOn(timerLogic, 'calculateTargetDuration').mockReturnValue(30);
      jest.spyOn(timerLogic, 'getDayNumber').mockReturnValue(1);

      render(<PlankTimer />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
      expect(screen.getByText('Auto-Detection Mode')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle zero duration', () => {
      jest.spyOn(timerLogic, 'calculateTargetDuration').mockReturnValue(0);
      jest.spyOn(timerLogic, 'getDayNumber').mockReturnValue(1);
      jest.spyOn(timerLogic, 'formatDuration').mockReturnValue('00:00');

      render(<PlankTimer />);

      expect(screen.getByText('00:00')).toBeInTheDocument();
    });

    it('should handle large day numbers', () => {
      jest.spyOn(timerLogic, 'calculateTargetDuration').mockReturnValue(300);
      jest.spyOn(timerLogic, 'getDayNumber').mockReturnValue(100);
      jest.spyOn(timerLogic, 'formatDuration').mockReturnValue('05:00');

      render(<PlankTimer />);

      expect(screen.getByText('Day 100 Challenge')).toBeInTheDocument();
    });

    it('should maintain detection mode state across transitions', () => {
      jest.spyOn(timerLogic, 'calculateTargetDuration').mockReturnValue(30);
      jest.spyOn(timerLogic, 'getDayNumber').mockReturnValue(1);
      jest.spyOn(timerLogic, 'formatDuration').mockReturnValue('00:30');

      render(<PlankTimer />);

      // Enable detection mode
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();

      // Start recording
      const startButton = screen.getByRole('button', { name: /Start Detection Mode/i });
      fireEvent.click(startButton);

      // Should pass detection mode to VideoRecorder
      expect(screen.getByText('Detection Mode: Yes')).toBeInTheDocument();
    });
  });
});
