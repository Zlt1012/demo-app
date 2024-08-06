import React, { useEffect, useState, useRef } from "react";
import { Input, Table, Tabs, Tag, Card } from "antd";
import featureData from "./world.zh.json";
import { Scatter } from "@antv/g2plot";
import lemonIcon from "../../assets/icon/icon-lemon.svg";
import { columns } from "./config";
import { tableData, chartData2 } from "./mockData";
import "./style.css";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
const { Search } = Input;

const Page = () => {
  const mapRef = useRef(null);
  const scatterPlotRef = useRef(null);
  const fillLayerRef = useRef(null);
  const [dataSource, setDataSource] = useState(tableData);
  const [chartData, setChartData] = useState(chartData2);
  const [isDrawerOpens, setIsDrawerOpens] = useState([false, false]);
  const [selectedProjTags, setSelectedProjTags] = useState([]);
  const [selectedCustTags, setSelectedCustTags] = useState([]);
  const [selectedRangeTags, setSelectedRangeTags] = useState([]);
  const [mousemSelectedData, setMousemSelectedData] = useState("");
  const [markedArea, setMarkedArea] = useState([]);
  const [projectsData, setProjectsData] = useState([]);
  const [customnersData, setCustomnersData] = useState([]);
  const [publishData, setPublishData] = useState([]);

  const feishuDataRef = useRef([]);
  const [currentFeishuData, setCurrentFeishuData] = useState([]);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    const area =
      currentFeishuData?.map?.((v) => v?.fields?.["授权区域"])?.flat() || [];
    console.log(area);
    renderMap(area);
  }, [currentFeishuData]);

  const init = async () => {
    renderChart();
    initMap();
    fetchFeishuAppData();
  };

  const fetchFeishuAppData = async () => {
    const responseAccessToken = await fetch(
      "/open-apis/auth/v3/app_access_token/internal",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          app_secret: "D8ghPMwm5gnsxJVVqXo6hgEdpXIEcpls",
          app_id: "cli_a6258e69ff70900c",
        }),
      }
    );
    if (!responseAccessToken.ok) {
      throw new Error(`HTTP error! status: ${responseAccessToken.status}`);
    }

    // 将响应体解析为 JSON
    const accessToken = await responseAccessToken.json();
    console.log(accessToken);

    const appId = "SRNFbD1xSasuOEsxeJFcR0dWn1d";
    const responseTable = await fetch(
      `/open-apis/bitable/v1/apps/${appId}/tables`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + accessToken.app_access_token,
        },
      }
    );

    // 将响应体解析为 JSON
    const tablesFeishu = await responseTable.json();
    console.log(tablesFeishu);
    const tableInfo = tablesFeishu.data.items.find(
      (table) => table.name === "合同信息"
    );
    const tableId = tableInfo.table_id;

    const recordsUrl = `/open-apis/bitable/v1/apps/${appId}/tables/${tableId}/records`;
    const responseRecords = await fetch(recordsUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + accessToken.app_access_token,
      },
    });

    // 将响应体解析为 JSON
    const recordsFeishu = await responseRecords.json();
    console.log(recordsFeishu);
    feishuDataRef.current = recordsFeishu.data.items;

    const authorityAreasSet = new Set();
    const projectsSet = new Set();
    const customersSet = new Set();
    const publishSet = new Set();
    recordsFeishu.data.items.forEach((record) => {
      const authorityArea = record.fields["授权区域"];
      if (authorityArea) {
        authorityArea.forEach((area) => {
          authorityAreasSet.add(area);
        });
      }

      const projects = record.fields["签约项目"];
      if (projects) {
        projectsSet.add(projects);
        // projects.forEach((item) => {
        //   projectsSet.add(item);
        // });
      }

      const customers = record.fields["对方签约公司"];
      if (customers) {
        customers.forEach((item) => {
          customersSet.add(item);
        });
      }

      const publish = record.fields["发行范围"];
      if (publish) {
        publish.forEach((item) => {
          publishSet.add(item);
        });
      }
    });
    console.log("authorityAreasSet-----", authorityAreasSet);

    setMarkedArea([...authorityAreasSet]);
    setProjectsData([...projectsSet]);
    setCustomnersData([...customersSet]);
    setPublishData([...publishSet]);

    console.log("projectsSetprojectsSet", projectsSet);
    // 默认显示全部项目的区域
    handlefeishuData();
    return [authorityAreasSet, projectsSet, customersSet];
  };

  const initMap = async () => {
    mapRef.current = new window.BMapGL.Map("allmap");
    let point = new window.BMapGL.Point(116.414, 39.915);
    mapRef.current.centerAndZoom(point, 1);
    mapRef.current.enableScrollWheelZoom(true);
    mapRef.current.setMapStyleV2({ styleJson: window.whiteStyle });
  };

  const getFillColor = () => {};

  const renderMap = async (markedArea) => {
    mapRef.current.removeNormalLayer(fillLayerRef.current);
    fillLayerRef.current = new window.BMapGL.FillLayer({
      crs: "GCJ02",
      enablePicked: true,
      autoSelect: true,
      pickWidth: 30,
      pickHeight: 30,
      selectedColor: "orange", // 悬浮选中项颜色
      border: true,
      style: {
        fillColor: [
          "case",
          ["boolean", ["feature-state", "picked"], false],
          "red",
          [
            "match",
            ["get", "name"],
            "泰国",
            "green",
            "菲律宾",
            "lightgrey",
            "日本",
            "blue",
            "缅甸",
            "cyan",
            "中国",
            "red",
            "darkviolet", // 明确指定默认值为空
          ],
        ],
        fillOpacity: 0.3,
        strokeWeight: 1,
        strokeColor: "white",
      },
    });
    const messageDom = document.getElementById("message");
    fillLayerRef.current.addEventListener("mousemove", function (e) {
      const name = e?.value?.dataItem?.properties?.name;
      if (name) {
        messageDom.style.display = "block";
        messageDom.style.left = e.pixel.x + 6 + "px";
        // 剩余的高度
        const restHeight = window.innerHeight - e.pixel.y;
        // 剩余的高度 > messageDom高度（256px） 就向上移动
        if (restHeight > 256) {
          messageDom.style.top = e.pixel.y + "px";
        } else {
          messageDom.style.top = e.pixel.y + restHeight - 256 + "px";
        }

        // 获取数据
        const list = currentFeishuData.filter((v) =>
          v?.fields?.["授权区域"]?.includes(name)
        );
        setMousemSelectedData(
          <Tabs
            defaultActiveKey="1"
            items={list.map((data, i) => ({
              key: i,
              label: data?.fields?.["签约项目"],
              children: (
                <div className="mouse_message">
                  <p>项目名称：{data?.fields?.["签约项目"]}</p>
                  <p>客户名称：{data?.fields?.["对方签约公司"]}</p>
                  <p>金额：${data?.fields?.["美元总价"]?.toLocaleString()}</p>
                  <p>
                    签约日期：
                    {data?.fields?.["合同签约时间"] &&
                      new Date(
                        data?.fields?.["合同签约时间"]
                      ).toLocaleDateString()}
                  </p>
                  <p>
                    到期日期：
                    {data?.fields?.["到期时间"] &&
                      new Date(data?.fields?.["到期时间"]).toLocaleDateString()}
                  </p>
                </div>
              ),
            }))}
          />
        );

        // this.updateState(e.value.dataIndex, { picked: true }, true);
      } else {
        if (messageDom?.style?.display) {
          messageDom.style.display = "none";
        }
      }
    });

    mapRef.current.addNormalLayer(fillLayerRef.current);
    const _featureData = JSON.parse(JSON.stringify(featureData));
    _featureData.features = _featureData.features.filter((feature) =>
      markedArea.includes(feature.properties.name)
    );
    fillLayerRef.current.setData(_featureData);
  };

  const renderChart = () => {
    if (!scatterPlotRef.current) {
      scatterPlotRef.current = new Scatter("chartContainer", {
        // padding: 40,
        data: chartData,
        xField: "year",
        yField: "month",
        size: 8,
        shape: "circle",
        pointStyle: {
          fill: "orange",
        },
        tooltip: false,
        // tooltip: {
        //   customContent: (title, data) => {
        //     return data?.[0]?.data?.name;
        //   },
        // },
        yAxis: {
          max: 13,
          label: false,
        },
        xAxis: {
          min: 2019,
          max: 2025,
          grid: {
            line: {
              style: {
                stroke: "#eee",
              },
            },
          },
          line: {
            style: {
              stroke: "#aaa",
            },
          },
        },
        label: {
          formatter: (data) => {
            return data?.name;
          },
          //    style: {
          //   fill: 'red',
          //   opacity: 0.6,
          //   fontSize: 24
          // }
        },
      });
      scatterPlotRef.current.render();
    }
  };

  const handlefeishuData = (data = [], type = "") => {
    // allData有值就是初始化时全选，没值就是正常逻辑选择时
    let _selectedProjTags = type === "proj" ? data : selectedProjTags;
    let _selectedCustTags = type === "cust" ? data : selectedCustTags;
    let _selectedRangeTags = type === "range" ? data : selectedRangeTags;
    //   签约项目 对方签约公司 [] 发行范围 []
    const _currentFeishuData = feishuDataRef.current
      .filter((v) => !!v?.fields?.["OA合同编号"])
      .map((v) => ({
        ...v,
        fields: {
          ...v.fields,
          对方签约公司: v.fields?.["对方签约公司"] || [],
          发行范围: v.fields?.["发行范围"] || [],
        },
      }))
      .filter(
        (v) =>
          // 项目 // 没选择=全选中，不算查询条件
          (_selectedProjTags.length === 0 ||
            _selectedProjTags.includes(v?.fields?.["签约项目"])) &&
          // 客户// 没选择=全选中，不算查询条件
          (_selectedCustTags.length === 0 ||
            v?.fields?.["对方签约公司"]?.some?.((value) =>
              _selectedCustTags.includes(value)
            ) ||
            (v?.fields?.["对方签约公司"].length === 0 &&
              _selectedCustTags.length === 0)) &&
          // 范围// 没选择=全选中，不算查询条件
          (_selectedRangeTags.length === 0 ||
            v?.fields?.["发行范围"]?.some?.((value) =>
              _selectedRangeTags.includes(value)
            ) ||
            (v?.fields?.["发行范围"].length === 0 &&
              _selectedRangeTags.length === 0))
        // end
      );
    setCurrentFeishuData(_currentFeishuData);
  };
  const handleChange = (tag, checked, type) => {
    console.log(tag, checked, type);
    if (type === "proj") {
      const nextSelectedTags = checked
        ? [...selectedProjTags, tag]
        : selectedProjTags.filter((t) => t !== tag);
      setSelectedProjTags(nextSelectedTags);
      handlefeishuData(nextSelectedTags, "proj");
    }
    if (type === "cust") {
      const nextSelectedTags = checked
        ? [...selectedCustTags, tag]
        : selectedCustTags.filter((t) => t !== tag);
      setSelectedCustTags(nextSelectedTags);
      handlefeishuData(nextSelectedTags, "cust");
    }

    if (type === "range") {
      const nextSelectedTags = checked
        ? [...selectedRangeTags, tag]
        : selectedRangeTags.filter((t) => t !== tag);
      setSelectedRangeTags(nextSelectedTags);
      handlefeishuData(nextSelectedTags, "range");
    }
  };
  const onClickonDrawerOpen = (index) => {
    const _isDrawerOpens = [...isDrawerOpens];
    _isDrawerOpens[index] = !_isDrawerOpens[index];
    setIsDrawerOpens(_isDrawerOpens);
    console.log(isDrawerOpens);
  };

  return (
    <div className="page">
      <div id="message" className="message">
        <span>{mousemSelectedData}</span>
      </div>
      <div className="area title">
        <img src={lemonIcon} alt="" />
        地区数据
      </div>
      <div
        className="left"
        style={{ height: isDrawerOpens[0] ? "calc(100% - 44px)" : "16px" }}
      >
        <div className="drawer_icon" onClick={() => onClickonDrawerOpen(0)}>
          {isDrawerOpens[0] ? (
            <MenuFoldOutlined width={"10px"} />
          ) : (
            <MenuUnfoldOutlined width={10} />
          )}
        </div>
        <div
          className="cards"
          style={{
            display: isDrawerOpens[0] ? "block" : "none",
            width: "200px",
          }}
        >
          <Card title="项目">
            {projectsData.map((item) => (
              <Tag.CheckableTag
                key={item}
                checked={selectedProjTags.includes(item)}
                onChange={(checked) => handleChange(item, checked, "proj")}
                color="red"
              >
                {item}
              </Tag.CheckableTag>
            ))}
          </Card>
          <Card title="客户" style={{ margin: "12px 0" }}>
            {customnersData.map((item) => (
              <Tag.CheckableTag
                key={item}
                checked={selectedCustTags.includes(item)}
                onChange={(checked) => handleChange(item, checked, "cust")}
                color="red"
              >
                {item}
              </Tag.CheckableTag>
            ))}
          </Card>
          <Card title="发行范围">
            {publishData.map((item) => (
              <Tag.CheckableTag
                key={item}
                checked={selectedRangeTags.includes(item)}
                onChange={(checked) => handleChange(item, checked, "range")}
                color="red"
              >
                {item}
              </Tag.CheckableTag>
            ))}
          </Card>
        </div>
      </div>
      <div id="allmap" className="map"></div>
      <div className="right">
        <div className="top">
          <p className="title">
            <span
              style={{ display: isDrawerOpens[1] ? "inline-block" : "none" }}
            >
              <img src={lemonIcon} alt="" />
              公司合作情况
            </span>

            <span
              className="drawer_icon"
              onClick={() => onClickonDrawerOpen(1)}
              style={{ float: "right" }}
            >
              {isDrawerOpens[1] ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </span>
          </p>
          <div
            id="chartContainer"
            style={{
              width: "410px",
              height: "320px",
              display: isDrawerOpens[1] ? "block" : "none",
            }}
          />
        </div>
        <div
          className="bottom"
          style={{
            display: isDrawerOpens[1] ? "block" : "none",
          }}
        >
          <p className="title">
            <img src={lemonIcon} alt="" />
            列表数据
          </p>
          <Table
            columns={columns}
            dataSource={dataSource}
            size="small"
            rowKey={"name"}
            pagination={false}
          />
        </div>
      </div>
    </div>
  );
};

// const MemoPage = React.memo(Page);

export default Page;
