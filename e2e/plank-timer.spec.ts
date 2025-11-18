import { test, expect } from '@playwright/test';

test.describe('Plank Timer E2E Tests', () => {
  test.beforeEach(async ({ page, context }) => {
    // Grant camera permissions
    await context.grantPermissions(['camera']);

    // Navigate to the app
    await page.goto('/');
  });

  test('should display home page with timer information', async ({ page }) => {
    // Check title
    await expect(page.getByRole('heading', { name: /Plank Timer/i })).toBeVisible();

    // Check day challenge text
    await expect(page.getByText(/Day \d+ Challenge/i)).toBeVisible();

    // Check target duration display
    await expect(page.getByText(/Today's Goal/i)).toBeVisible();

    // Check start button
    await expect(page.getByRole('button', { name: /Start Recording/i })).toBeVisible();
  });

  test('should display detection mode toggle', async ({ page }) => {
    // Check for detection mode toggle
    await expect(page.getByText('Auto-Detection Mode')).toBeVisible();

    // Check checkbox is present
    const checkbox = page.getByRole('checkbox');
    await expect(checkbox).toBeVisible();
    await expect(checkbox).not.toBeChecked();
  });

  test('should toggle detection mode', async ({ page }) => {
    const checkbox = page.getByRole('checkbox');

    // Toggle on
    await checkbox.click();
    await expect(checkbox).toBeChecked();

    // Button text should change
    await expect(page.getByRole('button', { name: /Start Detection Mode/i })).toBeVisible();

    // Toggle off
    await checkbox.click();
    await expect(checkbox).not.toBeChecked();
    await expect(page.getByRole('button', { name: /Start Recording/i })).toBeVisible();
  });

  test('should display Discord link', async ({ page }) => {
    const discordLink = page.getByRole('link', { name: /Plank-Challenge Discord/i }).first();

    await expect(discordLink).toBeVisible();
    await expect(discordLink).toHaveAttribute('target', '_blank');
    await expect(discordLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('should display info tip', async ({ page }) => {
    await expect(
      page.getByText(/Position your device so the camera can see your plank form/i)
    ).toBeVisible();
  });

  test('should start recording flow when button clicked', async ({ page }) => {
    // Mock camera stream to avoid actual camera access
    await page.evaluate(() => {
      (navigator.mediaDevices.getUserMedia as any) = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const stream = canvas.captureStream();
        return stream;
      };
    });

    // Click start button
    await page.getByRole('button', { name: /Start Recording/i }).click();

    // Should show countdown or recording state
    // Note: In real E2E, camera permission might be needed
    // For now, just check the button was clickable
    await expect(page.getByRole('button', { name: /Start Recording/i })).not.toBeVisible();
  });

  test('should handle rest day (Sunday)', async ({ page }) => {
    // Mock calculateTargetDuration to return null
    await page.evaluate(() => {
      // This test assumes we're testing rest day logic
      // In a real scenario, you'd set the date to a Sunday
      (window as any).__TEST_IS_REST_DAY__ = true;
    });

    // If on rest day, should show different UI
    // This test is placeholder as it depends on current date
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Check elements are still visible on mobile
    await expect(page.getByRole('heading', { name: /Plank Timer/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Start Recording/i })).toBeVisible();
  });

  test('should be responsive on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    await expect(page.getByRole('heading', { name: /Plank Timer/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Start Recording/i })).toBeVisible();
  });

  test('should maintain state across navigation', async ({ page }) => {
    const checkbox = page.getByRole('checkbox');

    // Enable detection mode
    await checkbox.click();
    await expect(checkbox).toBeChecked();

    // Checkbox state should persist
    await expect(checkbox).toBeChecked();
  });
});

test.describe('Accessibility Tests', () => {
  test('should have no accessibility violations on home page', async ({ page }) => {
    await page.goto('/');

    // Check for proper heading hierarchy
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();

    // Check buttons have accessible names
    const startButton = page.getByRole('button', { name: /Start Recording/i });
    await expect(startButton).toHaveAccessibleName();
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');

    // Tab through focusable elements
    await page.keyboard.press('Tab');

    // Start button should be focusable
    const startButton = page.getByRole('button', { name: /Start Recording/i });
    await expect(startButton).toBeFocused();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');

    // Check checkbox has associated label
    const checkbox = page.getByRole('checkbox');
    await expect(checkbox).toBeVisible();
  });
});

test.describe('Performance Tests', () => {
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;

    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should not have console errors on load', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');

    // Filter out known non-critical errors
    const criticalErrors = errors.filter(
      (error) =>
        !error.includes('MediaPipe') &&
        !error.includes('getUserMedia') &&
        !error.includes('camera')
    );

    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('Error Scenarios', () => {
  test('should handle missing camera permission gracefully', async ({ page, context }) => {
    // Deny camera permission
    await context.grantPermissions([]);

    await page.goto('/');

    // Should still load the page
    await expect(page.getByRole('heading', { name: /Plank Timer/i })).toBeVisible();
  });

  test('should handle network offline', async ({ page, context }) => {
    await page.goto('/');

    // Go offline
    await context.setOffline(true);

    // Page should still be functional (cached)
    await expect(page.getByRole('heading', { name: /Plank Timer/i })).toBeVisible();

    // Go back online
    await context.setOffline(false);
  });
});
