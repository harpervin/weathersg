import matplotlib.pyplot as plt
import numpy as np
from scipy.stats import pearsonr
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score


def plotLinearRegression(
    windspeed_totals, rainfall_totals, zone_color_map, windspeed_type
):
    # Prepare data
    regions = list(windspeed_totals.keys())
    X = np.array([windspeed_totals[region] for region in regions]).reshape(
        -1, 1
    )  # Independent variable: Windspeed
    Y = np.array([rainfall_totals[region] for region in regions]).reshape(
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
    print(f"{windspeed_type} Windspeed vs. Rainfall:")
    print(f"  Pearson Correlation (r): {correlation:.2f}")
    print(f"  R² Value: {r2:.2f}\n")

    # Get regression equation components
    slope = model.coef_[0][0]
    intercept = model.intercept_[0]
    equation_text = (
        f"Rainfall = {slope:.2f} * Windspeed + {intercept:.2f}  |  R² = {r2:.2f}"
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
    plt.xlabel("Total Windspeed (knots)")
    plt.ylabel("Total Rainfall (mm)")
    plt.title(f"Linear Regression: Predicting Rainfall from {windspeed_type} Windspeed")
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
    date = "2025-01-11"

    # Import district map and zone color map
    from helper_functions import import_dictionaries

    district_map, zone_color_map = import_dictionaries()

    # Fetch windspeed and rainfall data
    from rainfallByDateRegionSorted import calculateTotalRainfallByRegion
    from windspeedByRegion import (
        calculateAverageWindSpeedByRegion,
        calculateTotalWindSpeedByRegion,
        getAllWindSpeedData,
    )

    all_windspeeds_data = getAllWindSpeedData(date)

    windspeed_region_totals = calculateTotalWindSpeedByRegion(
        all_windspeeds_data, district_map
    )
    windspeed_region_averages = calculateAverageWindSpeedByRegion(all_windspeeds_data)
    rainfall_region_totals = calculateTotalRainfallByRegion(date, district_map)

    # Plot regression and predictions
    plotLinearRegression(
        windspeed_region_totals, rainfall_region_totals, zone_color_map, "Total"
    )
    plotLinearRegression(
        windspeed_region_averages, rainfall_region_totals, zone_color_map, "Average"
    )
    plt.show()
