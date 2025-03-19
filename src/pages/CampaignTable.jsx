import React, { useEffect, useState } from "react";
import { Table, Spin, message } from "antd";
import { useLocation } from "react-router-dom";
import axios from "axios";
import moment from "moment";

const CampaignTable = () => {
  const location = useLocation();
  const staticData = location.state || {};
  const [loading, setLoading] = useState(true);
  const [campaignData, setCampaignData] = useState([]);

  console.log("Received Static Data:", staticData); // Debugging

  useEffect(() => {
    if (!staticData.from || !staticData.to) {
      message.error("Invalid campaign data.");
      return;
    }
    fetchCampaignData(staticData);
  }, [staticData]);

  const fetchCampaignData = async ({
    from,
    to,
    timezoneID,
    offerID,
    affiliateID,
  }) => {
    setLoading(true);

    let extractedFrom = from?.$d ? moment(from.$d) : moment(from);
    let extractedTo = to?.$d ? moment(to.$d) : moment(to);

    if (!extractedFrom.isValid() || !extractedTo.isValid()) {
      console.error("Invalid date format:", { from, to });
      message.error("Invalid date range received.");
      setLoading(false);
      return;
    }

    const formattedFrom = extractedFrom.format("YYYY-MM-DD");
    const formattedTo = extractedTo.format("YYYY-MM-DD");

    const payload = {
      timezone_id: Number(timezoneID),
      currency_id: "USD",
      from: formattedFrom,
      to: formattedTo,
      columns: [
        { column: "offer" },
        { column: "affiliate" },
        { column: "date" },
      ],
      query: {
        filters: [
          { resource_type: "offer", filter_id_value: String(offerID) },
          { resource_type: "affiliate", filter_id_value: String(affiliateID) },
        ],
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

      const reachMap = staticData.reachByDate || {};
      const impressionMap = staticData.impressionByDate || {};
      const amountSpentMap = staticData.amountSpentByDate || {};
      const clicksAllMap = staticData.clicksAllByDate || {}; // ✅ Get Clicks All

      if (response.data && response.data.table) {
        const formattedData = response.data.table.map((item, index) => {
          const date = moment
            .unix(
              parseInt(
                item.columns.find((col) => col.column_type === "date")?.id
              )
            )
            .format("YYYY-MM-DD");

          const totalClicks = item.reporting.total_click || 0;
          const amountSpent = amountSpentMap[date] || 0;
          const impressions = impressionMap[date] || 0;
          const clicksAll = clicksAllMap[date] || 0; // ✅ Get Clicks All

          // ✅ Step 1: Calculate Cost Per Result
          const costPerResult =
            totalClicks > 0 ? (amountSpent / totalClicks).toFixed(2) : "N/A";

          // ✅ Step 2: Calculate CPM (Cost Per 1,000 Impressions)
          const cpm =
            impressions > 0
              ? ((amountSpent / impressions) * 1000).toFixed(2)
              : "N/A";

          // ✅ Step 3: Calculate CPC (Cost Per Click)
          const cpc =
            totalClicks > 0 ? (amountSpent / totalClicks).toFixed(2) : "N/A";

          // ✅ Step 4: Calculate CTR (Click-Through Rate)
          const ctr =
            impressions > 0
              ? ((totalClicks / impressions) * 100).toFixed(2)
              : "N/A";

          return {
            key: index,
            date,
            offer:
              item.columns.find((col) => col.column_type === "offer")?.label ||
              "N/A",
            affiliate:
              item.columns.find((col) => col.column_type === "affiliate")
                ?.label || "N/A",
            totalClicks,
            reach: reachMap[date] || 0,
            impressions,
            amountSpent,
            costPerResult, // ✅ Store Cost Per Result
            cpm, // ✅ Store CPM
            cpc, // ✅ Store CPC
            ctr, // ✅ Store CTR
            clicksAll, // ✅ Store Clicks All
          };
        });

        setCampaignData(formattedData);
      } else {
        message.error("No campaign data found.");
      }
    } catch (error) {
      console.error("Error fetching campaign data:", error);
      message.error("Failed to fetch campaign data.");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: "Date", dataIndex: "date", key: "date" },
    { title: "Link Clicks", dataIndex: "totalClicks", key: "totalClicks" },
    { title: "Results", dataIndex: "totalClicks", key: "totalClicks" },
    { title: "Reach", dataIndex: "reach", key: "reach" }, // ✅ Reach now correctly displayed
    { title: "Impressions", dataIndex: "impressions", key: "impressions" }, // ✅ Reach now correctly displayed
    { title: "Amount Spent", dataIndex: "amountSpent", key: "amountSpent" }, // ✅ Reach now correctly displayed
    {
      title: "Cost Per Result",
      dataIndex: "costPerResult",
      key: "costPerResult",
    }, // ✅ Now added!
    {
      title: "CPM",
      dataIndex: "cpm",
      key: "cpm",
    }, // ✅ Now added!
    { title: "CPC (Cost Per Click)", dataIndex: "cpc", key: "cpc" }, // ✅ CPC column added
    { title: "CTR (Click-Through Rate)", dataIndex: "ctr", key: "ctr" }, // ✅ CTR column added
    { title: "Clicks All", dataIndex: "clicksAll", key: "clicksAll" }, // ✅ Clicks All column added
  ];

  return (
    <div className="container">
      <h2>Campaign Data</h2>
      {loading ? (
        <Spin size="large" />
      ) : (
        <Table
          dataSource={campaignData}
          columns={columns}
          pagination={{ pageSize: 4 }}
        />
      )}
    </div>
  );
};

export default CampaignTable;
