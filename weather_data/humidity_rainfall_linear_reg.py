import matplotlib.pyplot as plt
import numpy as np
from scipy.stats import pearsonr
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score


def plotLinearRegression(
    independent_totals, dependent_totals, zone_color_map, independent_type, dependent_type
):
    """
    Perform and plot linear regression between independent and dependent variables.

    Args:
        independent_totals (dict): Data for independent variable (e.g., windspeed or humidity).
        dependent_totals (dict): Data for dependent variable (e.g., rainfall).
        zone_color_map (dict): Color map for regions.
        independent_type (str): Type of independent variable (e.g., 'Windspeed', 'Humidity').
        dependent_type (str): Type of dependent variable (e.g., 'Rainfall').
    """
    # Remove "City" region
    if "City" in independent_totals:
        independent_totals.pop("City")
    if "City" in dependent_totals:
        dependent_totals.pop("City")

    # Prepare data
    regions = list(independent_totals.keys())
    X = np.array([independent_totals[region] for region in regions]).reshape(
        -1, 1
    )  # Independent variable: Windspeed or Humidity
    Y = np.array([dependent_totals[region] for region in regions]).reshape(
        -1, 1
    )  # Dependent variable: Rainfall
    colors = [zone_color_map[region] for region in regions]

    # Fit linear regression model
    model = LinearRegression()
    model.fit(X, Y)
    Y_pred = model.predict(X)

    # Calculate R^2 score
    r2 = r2_score(Y, Y_pred)

    # Calculate Pearson correlation
    correlation, _ = pearsonr(X.flatten(), Y.flatten())

    # Print Pearson correlation and R² value
    print(f"{independent_type} vs. {dependent_type}:")
    print(f"  Pearson Correlation (r): {correlation:.2f}")
    print(f"  R² Value: {r2:.2f}\n")

    # Get regression equation components
    slope = model.coef_[0][0]
    intercept = model.intercept_[0]
    equation_text = (
        f"{dependent_type} = {slope:.2f} * {independent_type} + {intercept:.2f}  |  R² = {r2:.2f}"
    )

    # Plot scatter points
    plt.figure(figsize=(8, 6))
    plt.scatter(X, Y, c=colors, s=100, edgecolors="black", label="Regions")

    # Plot regression line
    plt.plot(X, Y_pred, color="red", linewidth=2, label="Regression Line")

    # Annotate regions
    for i, region in enumerate(regions):
        plt.text(X[i], Y[i], region, fontsize=9, ha="right")

    # Add labels, title, and legend
    plt.xlabel(f"{independent_type}")
    plt.ylabel(f"{dependent_type}")
    plt.title(f"Linear Regression: {dependent_type} vs. {independent_type}")
    plt.legend()
    plt.grid(True)

    # Add regression equation and R^2 score below the graph
    plt.figtext(
        0.5,
        0.01,
        equation_text,
        wrap=True,
        horizontalalignment="center",
        fontsize=10,
        bbox=dict(facecolor="white", edgecolor="black", boxstyle="round,pad=0.5"),
    )


if __name__ == "__main__":
    # Specify the date for data
    date = "2025-01-05"

    # Import district map and zone color map
    from helper_functions import import_dictionaries

    district_map, zone_color_map = import_dictionaries()

    # Fetch windspeed, rainfall, and humidity data
    from rainfallByDateRegionSorted import calculateAverageRainfallByRegion, calculateTotalRainfallByRegion
    from humidityByDateRegionSorted import calculateAverageHumidityByRegion

    rainfall_region_avg = calculateAverageRainfallByRegion(date, district_map)
    humidity_region_averages = calculateAverageHumidityByRegion(date, district_map)

    # Plot regression and predictions for humidity and rainfall
    plotLinearRegression(
        humidity_region_averages, rainfall_region_avg, zone_color_map, "Humidity (Average)", "Average Rainfall"
    )

    
    rainfall_region_totals = calculateTotalRainfallByRegion(date, district_map)
    print(rainfall_region_totals)
    plotLinearRegression(
        humidity_region_averages, rainfall_region_avg, zone_color_map, "Humidity (Average)", "Total Rainfall"
    )

    plt.show()
