import React, { useEffect, useState } from "react";
import {
  Table,
  Spin,
  message,
  Col,
  Row,
  Button,
  Form,
  Input,
  Switch,
} from "antd";
import { useLocation } from "react-router-dom";
import "./styles/CampaingsTable.css";
import axios from "axios";
import moment from "moment";
import Papa from "papaparse"; // ✅ Import papaparse

const CampaignTable = () => {
  const location = useLocation();
  const staticData = location.state || {};
  const [loading, setLoading] = useState(false);
  const [campaignData, setCampaignData] = useState([]);
  const handleFetchData = async (values) => {
    // ✅ Merge `staticData` with form `values`
    const updatedData = { ...staticData, ...values };

    // ✅ Pass updatedData to fetch function
    fetchCampaignData(updatedData);
  };

  const fetchCampaignData = async ({
    pageID,
    from,
    to,
    timezoneID,
    offerID,
    affiliateID,
    campaignImageLink,
    currentSwitch,
    bidStrategy,
    attributionSettings,
    campaignLink,
    budget,
    pageImageLink,
    pageName,
    adName,
    Ends,
    lastSignificent,
    quoteheading,
    quotetext,
    sechdule,
    campaignName,
    Frequency,
    Delivery,
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
          // ✅ Step 5: Calculate CTR (All)
          const ctrAll =
            impressions > 0
              ? ((clicksAll / impressions) * 100).toFixed(2)
              : "N/A";
          // ✅ Step 6: Calculate CPC (All)
          const cpcAll =
            clicksAll > 0 ? (amountSpent / clicksAll).toFixed(2) : "N/A";
          return {
            key: index,
            pageID,
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
            ctrAll, // ✅ Store CTR (All)
            cpcAll, // ✅ Store CPC (All)
            campaignImageLink,
            currentSwitch,
            bidStrategy,
            attributionSettings,
            campaignLink,
            budget,
            pageImageLink,
            pageName,
            adName,
            Ends,
            lastSignificent,
            quoteheading,
            quotetext,
            campaignName,
            Frequency,
            Delivery,
            sechdule,
          };
        });
        console.log(formattedData);
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
    { title: "Entry Date", dataIndex: "date", key: "date", width: 250 },
    { title: "Page ID", dataIndex: "pageID", key: "pageID", width: 250 },
    { title: "pageName", dataIndex: "pageName", key: "pageName", width: 250 },
    {
      title: "campaignName",
      dataIndex: "campaignName",
      key: "campaignName",
      width: 250,
    },
    { title: "Ad Name", dataIndex: "adName", key: "adName", width: 250 },
    {
      title: "Current Switch",
      dataIndex: "currentSwitch",
      key: "currentSwitch",
      width: 250,
      render: (text, record) => (record.currentSwitch ? "true" : "false"), // ✅ Show as ON/OFF
    },
    {
      title: "Campaign Link",
      dataIndex: "campaignLink",
      key: "campaignLink",
      width: 250,
    },
    {
      title: "Campaign Image Link",
      dataIndex: "campaignImageLink",
      key: "campaignImageLink",
      width: 250,
    },
    {
      title: "Page Image Link",
      dataIndex: "pageImageLink",
      key: "pageImageLink",
      width: 250,
    },
    { title: "Delivery", dataIndex: "Delivery", key: "Delivery", width: 250 },
    {
      title: "Bid Strategy",
      dataIndex: "bidStrategy",
      key: "bidStrategy",
      width: 250,
    },
    { title: "Budget", dataIndex: "budget", key: "budget", width: 250 },
    { title: "Ends", dataIndex: "Ends", key: "Ends", width: 250 },
    { title: "sechdule", dataIndex: "sechdule", key: "sechdule", width: 250 },
    {
      title: "Frequency",
      dataIndex: "Frequency",
      key: "Frequency",
      width: 250,
    },
    {
      title: "Quote Heading",
      dataIndex: "quoteheading",
      key: "quoteheading",
      width: 250,
    },
    {
      title: "Quote Text",
      dataIndex: "quotetext",
      key: "quotetext",
      width: 250,
    },
    {
      title: "lastSignificent",
      dataIndex: "lastSignificent",
      key: "lastSignificent",
      width: 250,
    },
    {
      title: "Attribution Settings",
      dataIndex: "attributionSettings",
      key: "attributionSettings",
      width: 250,
    },
    {
      title: "Link Clicks",
      dataIndex: "totalClicks",
      key: "totalClicks",
      width: 250,
    },
    { title: "Reach", dataIndex: "reach", key: "reach", width: 250 },
    {
      title: "Impressions",
      dataIndex: "impressions",
      key: "impressions",
      width: 250,
    },
    {
      title: "Amount Spent",
      dataIndex: "amountSpent",
      key: "amountSpent",
      width: 250,
      render: (text, record) =>
        record.amountSpent ? Number(record.amountSpent).toFixed(2) : "0.00",
    },
    {
      title: "Cost Per Result",
      dataIndex: "costPerResult",
      key: "costPerResult",
      width: 250,
    },
    { title: "CPM", dataIndex: "cpm", key: "cpm", width: 250 },
    { title: "CPC (Cost Per Click)", dataIndex: "cpc", key: "cpc", width: 250 },
    {
      title: "CTR (Click-Through Rate)",
      dataIndex: "ctr",
      key: "ctr",
      width: 250,
    },
    {
      title: "Clicks All",
      dataIndex: "clicksAll",
      key: "clicksAll",
      width: 250,
    },
    { title: "CTR (All)", dataIndex: "ctrAll", key: "ctrAll", width: 250 },
    { title: "CPC (All)", dataIndex: "cpcAll", key: "cpcAll", width: 250 },
  ];
  const handleDownloadCSV = () => {
    if (campaignData.length === 0) {
      message.error("No data available to download.");
      return;
    }

    // ✅ Map data to match correct CSV headers with requested keys
    const csvData = campaignData.map((row) => ({
      entryDate: row.date || "N/A",
      currentSwitch: row.currentSwitch ? "True" : "False",
      pageID: row.pageID || "N/A",
      sponsorName: row.pageName || "N/A",
      sponsorImageURL: row.pageImageLink || "N/A",
      campaingname: row.campaignName || "N/A",
      campainglink: row.campaignLink || "N/A",
      adname: row.adName || "N/A",
      Delivery: row.Delivery || "N/A",
      Bidstrategy: row.bidStrategy || "N/A",
      Budget: row.budget || "N/A",
      Attributionsetting: row.attributionSettings || "N/A",
      Results: row.totalClicks || "0",
      Reach: row.reach || "0",
      Impressions: row.impressions || "0",
      Costperresult: row.costPerResult || "N/A",
      Ends: row.Ends || "N/A",
      campaingImage: row.campaignImageLink || "N/A",
      LinksClicks: row.totalClicks || "0",
      Amountspent: row.amountSpent
        ? Number(row.amountSpent).toFixed(2)
        : "0.00",
      lastSignificent: row.lastSignificent || "N/A",
      schedule: row.sechdule || "N/A",
      quoteheading: row.quoteheading || "N/A",
      quotetext: row.quotetext || "N/A",
      frequency: row.Frequency || "N/A",
      CPM: row.cpm || "N/A", // ✅ Store CPM
      CPC: row.cpc || "N/A", // ✅ Store CPC
      ctr: row.ctr || "N/A", // ✅ Store CTR
      clicksAll: row.clicksAll || "0", // ✅ Store Clicks All
      CTRALL: row.ctrAll || "N/A", // ✅ Store CTR (All)
      CPCAll: row.cpcAll || "N/A", // ✅ Store CPC (All)
    }));

    // ✅ Convert to CSV
    const csv = Papa.unparse(csvData);

    // ✅ Create Blob and download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "CampaignData.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container">
      <h2>Campaign Data</h2>
      {/* ✅ Form to Enter Additional Data */}
      <Form layout="vertical" onFinish={handleFetchData}>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              label="Current Switch"
              name="currentSwitch"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Campaign Link" name="campaignLink">
              <Input placeholder="Enter Campaign Link" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Page Image Link" name="pageImageLink">
              <Input placeholder="Enter Page Image Link" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Campaign Image Link" name="campaignImageLink">
              <Input placeholder="Enter Campaign Image Link" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={6}>
            <Form.Item label="sechdule" name="sechdule">
              <Input placeholder="Enter Sechdule" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Bid Strategy" name="bidStrategy">
              <Input placeholder="Enter Bid Strategy" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Budget" name="budget">
              <Input placeholder="Enter Budget" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Attribution Settings" name="attributionSettings">
              <Input placeholder="Enter Attribution Settings" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item label="Ends" name="Ends">
              <Input placeholder="Enter Ends" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="lastSignificent" name="lastSignificent">
              <Input placeholder="LastSignificent" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="quoteheading" name="quoteheading">
              <Input placeholder="quoteheading" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="quotetext" name="quotetext">
              <Input placeholder="quotetext" />
            </Form.Item>
          </Col>
        </Row>

        <Button type="primary" htmlType="submit" loading={loading}>
          Fetch Data
        </Button>
        <Button
          type="primary"
          onClick={handleDownloadCSV}
          style={{ marginBottom: "10px", marginLeft: "10px" }}
        >
          Download CSV
        </Button>

        <br />
        <br />
      </Form>
      {loading ? (
        <Spin size="large" />
      ) : (
        <Table
          className="campaign-table" // ✅ Add className for styling
          dataSource={campaignData}
          columns={columns}
          scroll={{ x: "auto" }}
        />
      )}
    </div>
  );
};

export default CampaignTable;
