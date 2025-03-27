import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  Row,
  Col,
  DatePicker,
  message,
  Table,
  Spin,
} from "antd";
import "./App.css";
import axios from "axios";
import moment from "moment/moment";
import { useNavigate } from "react-router-dom";
import Papa from "papaparse";

const { RangePicker } = DatePicker;

const App = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [reportData, setReportData] = useState([]);
  const [formData, setFormData] = useState(null); // Stores the form data
  const getRandomMultiplier = () =>
    Math.floor(Math.random() * (80 - 70 + 1) + 70);
  const getRandomImpressionMultiplier = () =>
    Math.floor(Math.random() * (9 - 3 + 1) + 3);

  const onFinish = (values) => {
    setLoading(true);

    // Extract values from the form
    const { offerID, affiliateID, dateRange, timezoneID, ...staticData } =
      values;

    if (!dateRange || dateRange.length < 2) {
      message.error("Please select a valid date range");
      setLoading(false);
      return;
    }

    const from = dateRange[0];
    const to = dateRange[1];

    // Store form data in state
    const staticDataForCampaings = {
      pageID: values.pageID,
      pageName: values.pageName,
      campaignName: values.campaignName,
      adSetName: values.adSetName,
      adName: values.adName,
      adCreative: values.adCreative,
      Delivery: values.Delivery,
      Frequency: values.Frequency,
      pageImageLink: values.pageImageLink, // ✅ now safe
      timezoneID: values.timezoneID,
      offerID: values.offerID,
      affiliateID: values.affiliateID,
      from,
      to,
    };

    setFormData(staticDataForCampaings); // Save for navigation later
    // Call fetchReportingData with form values
    fetchReportingData({
      from,
      to,
      staticData,
      timezoneId: timezoneID,
      offerId: offerID,
      affiliateId: affiliateID,
    });
  };

  const platformColors = {
    Android: "#ffcccc", // Light Red
    macOS: "#ccffcc", // Light Green
    Windows: "#ccccff", // Light Blue
    iOS: "#ffffcc", // Light Yellow
    iPad: "#ffccff", // Light Pink
  };

  const impressionDeviceColors = {
    Feed: "#d9ead3", // Light Green
    Video_feeds: "#c9daf8", // Light Blue
    "Facebook Stories": "#f4cccc", // Light Red
    Marketplace: "#ffe599", // Light Orange
    Search: "#b4a7d6", // Light Purple
  };
  const getRandomValue = () =>
    (Math.random() * (0.55 - 0.11) + 0.11).toFixed(2);
  const getRandomMultiplierForClicksAll = () =>
    (Math.random() * (1.9 - 1.3) + 1.3).toFixed(2);
  const fetchReportingData = async ({
    from,
    to,
    staticData,
    timezoneId,
    offerId,
    affiliateId,
  }) => {
    setLoading(true);
    const payload = {
      timezone_id: Number(timezoneId),
      currency_id: "USD",
      from: from.format("YYYY-MM-DD"),
      to: to.format("YYYY-MM-DD"),
      columns: [
        { column: "offer" },
        { column: "affiliate" },
        { column: "date" },
        { column: "platform" },
      ],
      usm_columns: [],
      query: {
        filters: [
          { resource_type: "offer", filter_id_value: String(offerId) },
          { resource_type: "affiliate", filter_id_value: String(affiliateId) },
        ],
        exclusions: [],
        metric_filters: [],
        user_metrics: [],
        settings: {},
      },
    };

    try {
      const response = await axios.post(
        "https://api.eflow.team/v1/networks/reporting/entity",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            "X-Eflow-API-Key": process.env.XEflowAPIKey,
          },
        }
      );
      console.log(response.data);

      if (response.data && response.data.table) {
        const formattedData = [];
        const allowedPlatforms = ["Android", "macOS", "Windows", "iOS", "iPad"]; // ✅ Allowed platforms
        const impressionDevicesList = [
          "Facebook Stories",
          "Feed",
          "Marketplace",
          "Search",
          "Video_feeds",
        ];
        const impressionDevices = [
          { name: "Feed", percentage: 0.55 },
          { name: "Video_feeds", percentage: 0.07 },
          { name: "Facebook Stories", percentage: 0.13 },
          { name: "Marketplace", percentage: 0.19 },
          { name: "Search", percentage: 0.06 },
        ];

        response.data.table.forEach((item, index) => {
          const date = moment
            .unix(item.columns.find((col) => col.column_type === "date")?.id)
            .format("YYYY-MM-DD");

          const offer =
            item.columns.find((col) => col.column_type === "offer")?.label ||
            "N/A";
          const affiliate =
            item.columns.find((col) => col.column_type === "affiliate")
              ?.label || "N/A";
          const platform =
            item.columns.find((col) => col.column_type === "platform")?.label ||
            "N/A";

          let totalClicks = item.reporting.total_click || 0;
          let totalClicksAll = 0;

          // ✅ Clicks All for Main Row
          const clicksAllMain = Math.round(
            totalClicks * getRandomMultiplierForClicksAll()
          );
          totalClicksAll += clicksAllMain;
          if (!allowedPlatforms.includes(platform)) {
            return; // Skip unwanted platforms
          }

          let iPadClicks = 0;
          if (platform === "macOS") {
            iPadClicks = Math.max(1, Math.floor(totalClicks * 0.4)); // Ensure at least 1 click for iPad
            totalClicks = Math.ceil(totalClicks * 0.6);
          }
          let totalReach = 0;
          let totalImpressions = 0;

          // Store impression device cost values
          let totalCostPerResult = 0;
          let deviceCostResults = [];
          let totalAmountSpent = 0;
          let deviceReachResults = [];

          // Generate values for each impression device
          impressionDevices.forEach((device, deviceIndex) => {
            const deviceClicks = Math.round(totalClicks * device.percentage);
            const clicksAllImpressionDevice = Math.round(
              deviceClicks * getRandomMultiplierForClicksAll()
            );
            totalClicksAll += clicksAllImpressionDevice;
            const randomCost = parseFloat(getRandomValue());

            const amountSpent = deviceClicks * randomCost;
            const deviceCPC =
              deviceClicks > 0
                ? (amountSpent / deviceClicks).toFixed(2)
                : "N/A";

            totalAmountSpent += amountSpent; // Accumulate for platform "All" row
            totalCostPerResult += randomCost;
            deviceCostResults.push(randomCost);
            // Calculate Reach using a random multiplier (between 70 and 80)
            const reach = deviceClicks * getRandomMultiplier();
            const impressions = reach * getRandomImpressionMultiplier();
            const deviceCPM =
              impressions > 0
                ? ((amountSpent / impressions) * 1000).toFixed(2)
                : "N/A";
            totalReach += reach; // Accumulate for "All" row\
            totalImpressions += impressions; // Accumulate for "All" row

            deviceReachResults.push(reach);
            const deviceCTR =
              impressions > 0
                ? ((deviceClicks / impressions) * 100).toFixed(2)
                : "N/A"; // Calculate CTR (All) for the impression device
            const ctrAllImpressionDevice =
              impressions > 0
                ? ((clicksAllImpressionDevice / impressions) * 100).toFixed(2)
                : "N/A";
            const cpcAllImpressionDevice =
              clicksAllImpressionDevice > 0
                ? (amountSpent / clicksAllImpressionDevice).toFixed(2)
                : "N/A";
            formattedData.push({
              key: `${index}-impression-${deviceIndex}`,
              date,
              offer,
              affiliate,
              platform,
              totalClicks: deviceClicks,
              clicksAll: clicksAllImpressionDevice, // ✅ Clicks All for Impression Device
              reach: reach.toFixed(0),
              impressions: impressions.toFixed(0), // Store Impressions
              pageID: staticData.pageID,
              pageName: staticData.pageName,
              campaignName: staticData.campaignName,
              adSetName: staticData.adSetName,
              adName: staticData.adName,
              adCreative: staticData.adCreative,
              Delivery: staticData.Delivery,
              pageImageLink: staticData.pageImageLink,
              Frequency: staticData.Frequency,
              impressionDevices: device.name,
              costPerResult: randomCost,
              amountSpent: amountSpent.toFixed(2),
              cpc: deviceCPC, // ✅ Add CPC for each impression device
              cpm: deviceCPM, // ✅ CPM for each impression device
              ctr: deviceCTR, // ✅ CTR for each impression device
              ctrAll: ctrAllImpressionDevice, // ✅ Now Added CTR (All) for the impression device
              cpcAll: cpcAllImpressionDevice, // ✅ CPC (All) added here
            });
          });

          // Calculate the average Cost Per Result
          const avgCostPerResult =
            totalClicks > 0
              ? (totalAmountSpent / totalClicks).toFixed(2)
              : "N/A";

          const cpc =
            totalClicks > 0
              ? (totalAmountSpent / totalClicks).toFixed(2)
              : "N/A";
          const avgCPM =
            totalImpressions > 0
              ? ((totalAmountSpent / totalImpressions) * 1000).toFixed(2)
              : "N/A";
          const avgCTR =
            totalImpressions > 0
              ? ((totalClicks / totalImpressions) * 100).toFixed(2)
              : "N/A";
          const ctrAllMain =
            totalImpressions > 0
              ? ((clicksAllMain / totalImpressions) * 100).toFixed(2)
              : "N/A";
          const cpcAllMain =
            clicksAllMain > 0
              ? (totalAmountSpent / clicksAllMain).toFixed(2)
              : "N/A";
          formattedData.push({
            key: `${index}-main`,
            date,
            offer,
            affiliate,
            platform,
            totalClicks,
            reach: totalReach.toFixed(0),
            impressions: totalImpressions.toFixed(0), // ✅ Fix: Add summed impressions
            pageID: staticData.pageID,
            pageName: staticData.pageName,
            campaignName: staticData.campaignName,
            adSetName: staticData.adSetName,
            adName: staticData.adName,
            adCreative: staticData.adCreative,
            Delivery: staticData.Delivery,
            pageImageLink: staticData.pageImageLink,
            Frequency: staticData.Frequency,
            impressionDevices: "All",
            costPerResult: avgCostPerResult,
            amountSpent: totalAmountSpent.toFixed(2),
            cpc,
            cpm: avgCPM, // ✅ CPM for "All" platforms
            ctr: avgCTR, // ✅ CTR for "All" platforms
            clicksAll: clicksAllMain, // ✅ Clicks All Added
            ctrAll: ctrAllMain, // ✅ Added CTR (All)
            cpcAll: cpcAllMain, // ✅ CPC (All) added here
          });

          if (iPadClicks > 0) {
            let iPadTotalReach = 0;
            let iPadTotalImpressions = 0;
            let iPadTotalAmountSpent = 0;
            let iPadTotalCostPerResult = 0;
            let iPadTotalClicksAll = 0; // ✅ Initialize Clicks All total for iPad

            impressionDevices.forEach((device, deviceIndex) => {
              // ✅ Define deviceClicks BEFORE using it
              const deviceClicks = Math.round(iPadClicks * device.percentage);
              const clicksAllImpressionDevice = Math.round(
                deviceClicks * getRandomMultiplierForClicksAll()
              );

              // ✅ Now, safely use deviceClicks
              const clicksAlliPadImpression = Math.round(
                deviceClicks * getRandomMultiplierForClicksAll()
              );
              iPadTotalClicksAll += clicksAlliPadImpression;

              const randomCost = parseFloat(getRandomValue());
              const amountSpent = deviceClicks * randomCost;

              const reach = deviceClicks * getRandomMultiplier();
              const impressions = reach * getRandomImpressionMultiplier();

              iPadTotalReach += reach;
              iPadTotalImpressions += impressions;
              iPadTotalCostPerResult += randomCost;
              iPadTotalAmountSpent += amountSpent;

              const iPadCPC =
                deviceClicks > 0
                  ? (amountSpent / deviceClicks).toFixed(2)
                  : "N/A";
              const iPadCPM =
                iPadTotalImpressions > 0
                  ? (
                      (iPadTotalAmountSpent / iPadTotalImpressions) *
                      1000
                    ).toFixed(2)
                  : "N/A";
              const iPadCTR =
                iPadTotalImpressions > 0
                  ? ((iPadClicks / iPadTotalImpressions) * 100).toFixed(2) + "%"
                  : "N/A";
              const ctrAllImpressionDevice =
                impressions > 0
                  ? ((clicksAllImpressionDevice / impressions) * 100).toFixed(2)
                  : "N/A";
              const cpcAlliPadImpression =
                clicksAlliPadImpression > 0
                  ? (amountSpent / clicksAlliPadImpression).toFixed(2)
                  : "N/A";
              formattedData.push({
                key: `${index}-ipad-impression-${deviceIndex}`,
                date,
                offer,
                affiliate,
                platform: "iPad",
                totalClicks: deviceClicks,
                reach: reach.toFixed(0),
                impressions: impressions.toFixed(0),
                pageID: staticData.pageID,
                pageName: staticData.pageName,
                campaignName: staticData.campaignName,
                adSetName: staticData.adSetName,
                adName: staticData.adName,
                adCreative: staticData.adCreative,
                Delivery: staticData.Delivery,
                pageImageLink: staticData.pageImageLink,

                Frequency: staticData.Frequency,
                impressionDevices: device.name,
                costPerResult: randomCost.toFixed(2),
                amountSpent: amountSpent.toFixed(2),
                cpc: iPadCPC,
                cpm: iPadCPM,
                ctr: iPadCTR,
                clicksAll: clicksAlliPadImpression, // ✅ Clicks All for iPad Impression Device
                ctrAll: ctrAllImpressionDevice, // ✅ Added CTR (All)
                cpcAll: cpcAlliPadImpression, // ✅ CPC (All) added here
              });
            });

            const iPadAvgCostPerResult =
              iPadTotalCostPerResult > 0
                ? (iPadTotalCostPerResult / 5).toFixed(2)
                : "0.00";

            // ✅ Fix CPC Calculation
            const iPadCPCAll =
              iPadTotalClicksAll > 0
                ? (iPadTotalAmountSpent / iPadTotalClicksAll).toFixed(2)
                : "N/A";

            // ✅ Fix CPM Calculation
            const iPadCPMAll =
              iPadTotalImpressions > 0
                ? (
                    (iPadTotalAmountSpent / iPadTotalImpressions) *
                    1000
                  ).toFixed(2)
                : "N/A";

            // ✅ Fix CTR Calculation
            const iPadCTRAll =
              iPadTotalImpressions > 0
                ? ((iPadTotalClicksAll / iPadTotalImpressions) * 100).toFixed(
                    2
                  ) + "%"
                : "N/A";
            const ctrAlliPad =
              iPadTotalImpressions > 0
                ? ((iPadTotalClicksAll / iPadTotalImpressions) * 100).toFixed(2)
                : "N/A";
            const cpcAlliPad =
              iPadTotalClicksAll > 0
                ? (iPadTotalAmountSpent / iPadTotalClicksAll).toFixed(2)
                : "N/A";
            // ✅ Push iPad "All" row with correctly summed values
            formattedData.push({
              key: `${index}-ipad-main`,
              date,
              offer,
              affiliate,
              platform: "iPad",
              totalClicks: iPadClicks,
              reach: iPadTotalReach.toFixed(0),
              impressions: iPadTotalImpressions.toFixed(0),
              pageID: staticData.pageID,
              pageName: staticData.pageName,
              campaignName: staticData.campaignName,
              adSetName: staticData.adSetName,
              adName: staticData.adName,
              adCreative: staticData.adCreative,
              Delivery: staticData.Delivery,
              pageImageLink: staticData.pageImageLink,
              Frequency: staticData.Frequency,
              impressionDevices: "All",
              costPerResult: iPadAvgCostPerResult,
              amountSpent: iPadTotalAmountSpent.toFixed(2),
              cpc: iPadCPCAll, // ✅ Now correctly calculated
              cpm: iPadCPMAll, // ✅ Now correctly calculated
              ctr: iPadCTRAll, // ✅ Now correctly calculated
              clicksAll: iPadTotalClicksAll, // ✅ Summed at the end
              ctrAll: ctrAlliPad, // ✅ Added CTR (All)
              cpcAll: cpcAlliPad, // ✅ CPC (All) added here
            });
          }
        });

        // Sort by date
        formattedData.sort(
          (a, b) =>
            moment(a.date, "YYYY-MM-DD").unix() -
            moment(b.date, "YYYY-MM-DD").unix()
        );
        const {
          campaignName,
          adSetName,
          adCreative,
          Delivery,
          pageImageLink,
          Frequency,
          adName,
          pageName,
          date,
          pageID,
        } = staticData;
        const reportStartDate = from ? from.format("YYYY-MM-DD") : "N/A";

        // Insert the four extra rows **only once** at the top
        const extraRows = [
          {
            key: "extra4",
            date: reportStartDate,
            offer: "N/A",
            affiliate: "N/A",
            platform: "All",
            totalClicks: "",
            reach: "",
            impressions: "",
            pageID: pageID,
            pageName,
            campaignName: campaignName,
            adSetName: "All",
            adName: "All",
            adCreative: "All",
            Delivery: Delivery,
            pageImageLink: pageImageLink,
            Frequency: Frequency,
            impressionDevices: "All",
            costPerResult: "",
            amountSpent: "",
            cpc: "",
            cpm: "",
            ctr: "",
            ctrAll: "",
          },
          {
            key: "extra3",
            date: reportStartDate,
            offer: "N/A",
            affiliate: "N/A",
            platform: "All",
            totalClicks: "",
            reach: "",
            impressions: "",
            pageID: pageID,
            Delivery: Delivery,
            pageImageLink: pageImageLink,
            Frequency: Frequency,
            pageName,
            campaignName,
            adSetName: adSetName,
            adName: "All",
            adCreative: "All",
            impressionDevices: "All",
            costPerResult: "",
            amountSpent: "",
            cpc: "",
            cpm: "",
            ctr: "",
            ctrAll: "",
          },
          {
            key: "extra2",
            date: reportStartDate,
            offer: "N/A",
            affiliate: "N/A",
            platform: "All",
            totalClicks: "",
            reach: "",
            impressions: "",
            pageID: pageID,
            Delivery: Delivery,
            pageImageLink: pageImageLink,
            Frequency: Frequency,
            pageName,
            campaignName,
            adSetName: adSetName,
            adName: adName,
            adCreative: "All",
            impressionDevices: "All",
            costPerResult: "",
            amountSpent: "",
            cpc: "",
            cpm: "",
            ctr: "",
            ctrAll: "",
          },
          {
            key: "extra1",
            date: reportStartDate,
            offer: "N/A",
            affiliate: "N/A",
            platform: "All",
            totalClicks: "",
            reach: "",
            impressions: "",
            pageID: pageID,
            Delivery: Delivery,
            pageImageLink: pageImageLink,
            Frequency: Frequency,
            pageName,
            campaignName,
            adSetName: adSetName,
            adName: adName,
            adCreative: adCreative,
            impressionDevices: "All",
            costPerResult: "",
            amountSpent: "",
            cpc: "",
            cpm: "",
            ctr: "",
            ctrAll: "",
          },
        ];

        // Combine extra rows and data
        const finalData = [...extraRows, ...formattedData];
        setReportData(finalData);
      }
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };
  const columns = [
    { title: "Page ID", dataIndex: "pageID", key: "pageID" },
    { title: "Entry Date", dataIndex: "date", key: "date" },
    { title: "Page Name", dataIndex: "pageName", key: "pageName" },
    { title: "Delivery", dataIndex: "Delivery", key: "Delivery" },
    { title: "Frequency", dataIndex: "Frequency", key: "Frequency" },
    {
      title: "Page Image Link",
      dataIndex: "pageImageLink",
      key: "pageImageLink",
      width: 250,
    },
    {
      title: "Campaign Name",
      dataIndex: "campaignName",
      key: "campaignName",
      width: "200px",
    },
    { title: "Ad Set Name", dataIndex: "adSetName", key: "adSetName" },
    { title: "Ad Name", dataIndex: "adName", key: "adName" },
    { title: "Ad Creative", dataIndex: "adCreative", key: "adCreative" },
    {
      title: "Platform",
      dataIndex: "platform",
      key: "platform",
      render: (text) => (
        <span
          style={{
            backgroundColor: platformColors[text] || "white",
            padding: "5px",
            borderRadius: "5px",
          }}
        >
          {text}
        </span>
      ),
    },
    {
      title: "Impression Devices",
      dataIndex: "impressionDevices",
      key: "impressionDevices",
      width: "200px",
      render: (text) => (
        <span
          style={{
            backgroundColor: impressionDeviceColors[text] || "white",
            padding: "5px",
            borderRadius: "5px",
          }}
        >
          {text}
        </span>
      ),
    },
    {
      title: "Amount Spent",
      dataIndex: "amountSpent",
      key: "amountSpent",
      width: 200,
    },
    {
      title: "Impressions",
      dataIndex: "impressions",
      key: "impressions",
      width: 200,
    },
    {
      title: "Reach",
      dataIndex: "reach",
      key: "reach",
      width: 200,
    },
    {
      title: "Link Clicks",
      dataIndex: "totalClicks",
      key: "totalClicks",
      width: 200,
    },

    {
      title: "Cost Per Result",
      dataIndex: "costPerResult",
      key: "costPerResult",
      width: 200,
    },

    {
      title: "CPC (Cost Per Click)",
      dataIndex: "cpc",
      key: "cpc",
      width: 200,
    },

    {
      title: "CPM (cost per 1,000 impressions)",
      dataIndex: "cpm",
      key: "cpm",
      width: 200,
    },
    { title: "CTR", dataIndex: "ctr", key: "ctr", width: 200 },
    {
      title: "Clicks All",
      dataIndex: "clicksAll",
      key: "clicksAll",
      width: 200,
    },
    {
      title: "CTR (All)",
      dataIndex: "ctrAll",
      key: "ctrAll",
      width: 200,
    },
    {
      title: "CPC (All)",
      dataIndex: "cpcAll",
      key: "cpcAll",
      width: 200,
    },
  ];
  const handleNavigateToCampaignTable = () => {
    if (formData) {
      // Calculate Reach, Impressions, Amount Spent & Clicks All Sum by Date
      const reachByDate = {};
      const impressionByDate = {};
      const amountSpentByDate = {};
      const clicksAllByDate = {}; // ✅ New Clicks All Calculation

      reportData.forEach((item) => {
        if (item.impressionDevices === "All") {
          // ✅ Sum up Reach
          if (!reachByDate[item.date]) {
            reachByDate[item.date] = 0;
          }
          reachByDate[item.date] += Number(item.reach) || 0;

          // ✅ Sum up Impressions
          if (!impressionByDate[item.date]) {
            impressionByDate[item.date] = 0;
          }
          impressionByDate[item.date] += Number(item.impressions) || 0;

          // ✅ Sum up Amount Spent
          if (!amountSpentByDate[item.date]) {
            amountSpentByDate[item.date] = 0;
          }
          amountSpentByDate[item.date] += Number(item.amountSpent) || 0;

          // ✅ Sum up Clicks All
          if (!clicksAllByDate[item.date]) {
            clicksAllByDate[item.date] = 0;
          }
          clicksAllByDate[item.date] += Number(item.clicksAll) || 0;
        }
      });

      // ✅ Add all calculated values to formData
      const updatedFormData = {
        ...formData,
        reachByDate,
        impressionByDate,
        amountSpentByDate,
        clicksAllByDate, // ✅ Add Clicks All to formData
      };

      navigate("/campaingtable", { state: updatedFormData });
    }
  };

  const orderedImpressionDevices = [
    "Facebook Stories",
    "Feed",
    "Marketplace",
    "Search",
    "Video_feeds",
  ];

  // ✅ Platform name replacements for CSV
  const platformLabelMap = {
    Android: "Device: Android Smartphone",
    macOS: "Device: Android Tablet",
    Windows: "Device: Desktop",
    iPad: "Device: iPad",
    iOS: "Device: iPhone",
  };

  // ✅ Ordered platform sequence
  const orderedPlatforms = ["Android", "macOS", "Windows", "iPad", "iOS"];

  const handleDownloadCSV = () => {
    if (reportData.length === 0) {
      message.error("No data available to download.");
      return;
    }

    // ✅ Extract the 4 "All-All" rows to inject later
    const topAllRows = reportData.filter(
      (row) => row.platform === "All" && row.impressionDevices === "All"
    );

    // ✅ Group remaining data by date + platform
    const grouped = {};

    reportData
      .filter(
        (row) => !(row.platform === "All" && row.impressionDevices === "All")
      )
      .forEach((row) => {
        const key = `${row.date}_${row.platform}`;
        if (!grouped[key]) {
          grouped[key] = {
            date: row.date,
            platform: row.platform,
            allRow: null,
            devices: [],
          };
        }

        if (row.impressionDevices === "All") {
          grouped[key].allRow = row;
        } else {
          grouped[key].devices.push(row);
        }
      });

    // ✅ Group keys by date first
    const groupedByDate = {};
    Object.keys(grouped).forEach((key) => {
      const [date, platform] = key.split("_");
      if (!groupedByDate[date]) {
        groupedByDate[date] = {};
      }
      groupedByDate[date][platform] = grouped[key];
    });

    // ✅ Step 4: Build final reordered data
    let reorderedData = [];

    const sortedDates = Object.keys(groupedByDate).sort(); // Sort dates ascending

    sortedDates.forEach((date) => {
      // Inject 4 All-All rows at the top of each date (with current date set)
      const duplicatedTopRows = topAllRows.map((row) => ({
        ...row,
        date: date,
      }));
      reorderedData.push(...duplicatedTopRows);

      const platformsInDate = groupedByDate[date];

      orderedPlatforms.forEach((platform) => {
        const key = `${date}_${platform}`;
        if (platformsInDate[platform]) {
          const { allRow, devices } = platformsInDate[platform];
          if (allRow) reorderedData.push(allRow);

          orderedImpressionDevices.forEach((device) => {
            const match = devices.find((r) => r.impressionDevices === device);
            if (match) reorderedData.push(match);
          });
        }
      });
    });

    // ✅ Step 5: Prepare CSV Data with replaced platform names
    const csvData = reorderedData.map((row) => ({
      "Entry Date": row.date ? moment(row.date).format("MM/DD/YYYY") : "",
      "Page ID": row.pageID || "",
      "Page Name": row.pageName || "",
      // Delivery: row.Delivery || "",
      // Frequency: row.Frequency || "",
      pageImageLink: row.pageImageLink || "",
      "Campaign Name": row.campaignName || "",
      "Ad Set Name": row.adSetName || "",
      "Ad Name": row.adName || "",
      "Ad Creative": row.adCreative || "",
      "Impression Device": platformLabelMap[row.platform] || row.platform || "",
      Placement: row.impressionDevices || "",
      "Amount Spent": row.amountSpent ? Number(row.amountSpent).toFixed(2) : "",
      Impressions: row.impressions || "",
      Reach: row.reach || "",
      Results: row.totalClicks || "",
      "Link Clicks": row.totalClicks || "",
      "Cost per result": row.costPerResult || "",
      "CPC (cost per link click)": row.cpc || "",
      "CPM (cost per 1,000 impressions)": row.cpm || "",
      CTR: row.ctr || "",
      "Clicks (all)": row.clicksAll || "",
      "CTR (all)": row.ctrAll || "",
      "CPC (all)": row.cpcAll || "",
    }));

    // ✅ Download CSV
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Reportingdata.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container">
      <h2>Ad Campaign Form</h2>
      <Form requiredMark={false} layout="vertical" onFinish={onFinish}>
        {/* First Row: Offer ID, Affiliate ID, Date Range, Timezone ID */}
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              label="Offer ID"
              name="offerID"
              rules={[{ required: true, message: "Please enter Offer ID" }]}
            >
              <Input type="number" placeholder="Enter Offer ID" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="Affiliate ID"
              name="affiliateID"
              rules={[{ required: true, message: "Please enter Affiliate ID" }]}
            >
              <Input type="number" placeholder="Enter Affiliate ID" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="Date Range"
              name="dateRange"
              rules={[{ required: true, message: "Please select Date Range" }]}
            >
              <RangePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="Timezone ID"
              name="timezoneID"
              rules={[{ required: true, message: "Please enter Timezone ID" }]}
            >
              <Input type="number" placeholder="Enter Timezone ID" />
            </Form.Item>
          </Col>
        </Row>

        {/* Second Row: Page ID, Page Name, Campaign Name, Ad Set Name */}
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              label="Page ID"
              name="pageID"
              rules={[{ required: true, message: "Please enter Page ID" }]}
            >
              <Input type="number" placeholder="Enter Page ID" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="Page Name"
              name="pageName"
              rules={[{ required: true, message: "Please enter Page Name" }]}
            >
              <Input placeholder="Enter Page Name" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="Campaign Name"
              name="campaignName"
              rules={[
                { required: true, message: "Please enter Campaign Name" },
              ]}
            >
              <Input placeholder="Enter Campaign Name" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="Ad Set Name"
              name="adSetName"
              rules={[{ required: true, message: "Please enter Ad Set Name" }]}
            >
              <Input placeholder="Enter Ad Set Name" />
            </Form.Item>
          </Col>
        </Row>

        {/* Third Row: Ad Name, Ad Creative */}
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              label="Ad Name"
              name="adName"
              rules={[{ required: true, message: "Please enter Ad Name" }]}
            >
              <Input placeholder="Enter Ad Name" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="Ad Creative"
              name="adCreative"
              rules={[{ required: true, message: "Please enter Ad Creative" }]}
            >
              <Input placeholder="Enter Ad Creative" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="Delivery"
              name="Delivery"
              rules={[{ required: true, message: "Please enter Delivery" }]}
            >
              <Input placeholder="Enter Delivery" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="Frequency"
              name="Frequency"
              rules={[{ required: true, message: "Please enter Frequency" }]}
            >
              <Input placeholder="Enter Frequency" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              label="Page Image Link"
              name="pageImageLink"
              rules={[
                { required: true, message: "Please enter pageImageLink" },
              ]}
            >
              <Input placeholder="Enter pageImageLink" />
            </Form.Item>
          </Col>
        </Row>

        {/* Submit Button */}
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Submit
          </Button>
        </Form.Item>
      </Form>
      {loading
        ? "loading..."
        : reportData.length > 0 && (
            <>
              <Button
                type="default"
                onClick={handleDownloadCSV}
                style={{ marginBottom: "20px" }}
              >
                Downlaod Reporting Data
              </Button>
            </>
          )}

      {loading ? (
        <Spin size="large" />
      ) : (
        <Table
          rowClassName={(record) => {
            return platformColors[record.platform]
              ? "platform-row"
              : "impression-device-row";
          }}
          scroll={{ x: "max-content", y: "auto" }} // ✅ Enable horizontal scrolling
          dataSource={reportData}
          className="custom-table"
          columns={columns}
          pagination={false}
        />
      )}
      {/* Show Table only if report data exists */}
      {loading ? (
        <Spin size="large" />
      ) : (
        reportData.length > 0 && (
          <>
            <Button
              type="default"
              onClick={handleNavigateToCampaignTable}
              style={{ marginTop: "20px" }}
            >
              Genreate Campaigns Data
            </Button>
          </>
        )
      )}
    </div>
  );
};

export default App;
