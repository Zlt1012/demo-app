import React, { useEffect, useState, useRef } from "react";
import { Input, Table, Tabs, Tag, Card } from "antd";
import featureData from "./world.zh.json";
import dayjs from "dayjs";
import lemonIcon from "../../assets/icon/icon-lemon.svg";
import trustIcon from "../../assets/icon/trust.svg";
import run from "../../assets/icon/run.svg";
import goal from "../../assets/icon/goal.svg";
import du_jia from "../../assets/icon/du_jia.svg";
import unknow from "../../assets/icon/unknow.svg";
import trustIcon_white from "../../assets/icon/trust_white.svg";
import run_white from "../../assets/icon/run_white.svg";
import goal_white from "../../assets/icon/goal_white.svg";
import du_jia_white from "../../assets/icon/du_jia_white.svg";
import unknow_white from "../../assets/icon/unknow_white.svg";
import { tableData, chartData2 } from "./mockData";
import "./style.css";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";

const COLOR = {
  red: "#ffccc7",
  red_selected: "#cf1322",
  green: "#d9f7be",
  green_selected: "#389e0d",
  yellow: "#fff1b8",
  yellow_selected: "#d48806",
  blue: "#bae0ff",
  blue_selected: "#0958d9",
};

const ENUM_COLOR = [
  "red",
  "pink",
  "blue",
  "purple",
  "cyan",
  "yellow",
  "darkblue",
  "fuchsia",
  "hotpink",
  "darkgreen",
  "lightgreen",
  "navy",
  "gold",
];

// 是不是手机
const isMobileDevice =
  /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

const Page = () => {
  const mapRef = useRef(null);
  const fillLayerRef = useRef(null);

  const [dataSource, setDataSource] = useState(tableData);
  const [chartData, setChartData] = useState(chartData2);
  const [isDrawerOpens, setIsDrawerOpens] = useState([false, false]);
  const [selectedProjTags, setSelectedProjTags] = useState([]);
  const [selectedCustTags, setSelectedCustTags] = useState([]);
  const [selectedRangeTags, setSelectedRangeTags] = useState([]);
  const [selectedStatusTags, setSelectedStatusTags] = useState([]);
  const [selectedOnlyOneTags, setSelectedOnlyOneTags] = useState([]);
  const [selectedEndDateTags, setSelectedEndDateTags] = useState([]);
  const [selectedArea, setSelectedArea] = useState("");
  const [markedArea, setMarkedArea] = useState([]);
  const [projectsData, setProjectsData] = useState([]);
  const [customnersData, setCustomnersData] = useState([]);
  const [publishData, setPublishData] = useState([]);
  const [onlyOneData, setOnlyOneData] = useState([]); // 是否独家签约
  const [endDateData, setEndDateData] = useState(["近半年", "近一年"]); // 签约到期时间
  const [statusData, setStatusData] = useState([]); // 项目状态
  const [selectedProjStatusTags, setSelectedProjStatusTags] = useState([]);
  const [selectedRangeStatusTags, setSelectedRangeStatusTags] = useState([]);
  const [duJia, setDuJia] = useState([]);
  const [feiDuJia, setFeiDuJia] = useState([]);
  const [issuanceRights, setIssuanceRights] = useState([]);
  const [okProjStatus, setOkProjStatus] = useState([]);
  const [goalProjStatus, setGoalProjStatus] = useState([]);
  const [ingProjStatus, setIngProjStatus] = useState([]);

  const feishuDataRef = useRef([]);
  const [currentFeishuData, setCurrentFeishuData] = useState([]);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    const area =
      currentFeishuData?.map?.((v) => v?.fields?.["授权区域"])?.flat() || [];
    console.log(area);
    const areaSet = new Set();
    area.forEach((item) => {
      areaSet.add(item);
    });
    renderMap([...areaSet]);
  }, [currentFeishuData]);

  const init = async () => {
    initMap();
    fetchFeishuAppData();
  };

  window.addEventListener("scroll", () => {
    // 获取页面当前滚动的距离
    const dynamicDiv = document.querySelector("#allmap");
    const scrollHeight = window.scrollY;
    // 更新元素的高度，增加的高度为滚动距离
    dynamicDiv.style.height = `calc(100vh + ${scrollHeight}px)`;
  });

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
    const statusSet = new Set();
    const onlyOneSet = new Set();
    recordsFeishu.data.items.forEach((record) => {
      const authorityArea = record.fields?.["授权区域"];
      if (authorityArea) {
        authorityArea.forEach((area) => {
          authorityAreasSet.add(area);
        });
      }

      const projects = record.fields?.["签约项目"];
      projects && projectsSet.add(projects);

      const customers = record.fields?.["对方签约公司"];
      if (customers) {
        customers.forEach((item) => {
          customersSet.add(item);
        });
      }

      const publish = record.fields?.["发行权利"];
      if (publish) {
        publish.forEach((item) => {
          publishSet.add(item);
        });
      }
      const status = record.fields?.["项目状态"];
      status && statusSet.add(status);

      const onlyOne = record.fields?.["是否独家签约"];
      onlyOne && onlyOneSet.add(onlyOne);
    });
    console.log("authorityAreasSet-----", authorityAreasSet);

    setMarkedArea([...authorityAreasSet]);
    setProjectsData([...projectsSet]);
    setCustomnersData([...customersSet]);
    setPublishData([...publishSet]);
    setStatusData([...statusSet]);
    setOnlyOneData([...onlyOneSet]);

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

  // 获取国家的颜色
  const getFillColor = (markedArea) => {
    return markedArea
      .filter((v) => !!v)
      .map((value, index) => [value, ENUM_COLOR[index % ENUM_COLOR.length]])
      .flat();
  };

  const renderMap = async (markedArea) => {
    const fillColor = getFillColor(markedArea);
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
            ...fillColor,
            "中国",
            "red",
            "green", // 明确指定默认值为空
          ],
        ],
        fillOpacity: 0.3,
        strokeWeight: 1,
        strokeColor: "white",
      },
    });
    const messageDom = document.getElementById("message");
    const issueRightDom = document.getElementById("issueRight");
    const projSigStaDom = document.getElementById("projectSigningStatus");
    fillLayerRef.current.addEventListener(
      // isMobileDevice ? "click" : "mousemove",
      "click",
      (e) => {
        setSelectedProjStatusTags([]);
        const name = e?.value?.dataItem?.properties?.name;
        setSelectedArea(name);
        if (name) {
          messageDom.style.display = "block";
          issueRightDom.style.display = "block";
          projSigStaDom.style.display = "block";
          setIsDrawerOpens([isDrawerOpens[0], true]);
          // this.updateState(e.value.dataIndex, { picked: true }, true);
        } else {
          if (messageDom?.style?.display) {
            messageDom.style.display = "none";
            issueRightDom.style.display = "none";
            projSigStaDom.style.display = "none";
          }
        }
      }
    );

    mapRef.current.addNormalLayer(fillLayerRef.current);
    const _featureData = JSON.parse(JSON.stringify(featureData));
    _featureData.features = _featureData.features.filter((feature) =>
      markedArea.includes(feature.properties.name)
    );
    fillLayerRef.current.setData(_featureData);
  };

  // 判断是否半年、一年
  const verifyTime = (selectedData, timestamp) => {
    const date = dayjs(timestamp);
    const now = dayjs();
    const sixMonthsAgo = now.subtract(6, "month");
    const oneYearAgo = now.subtract(1, "year");
    return selectedData.some((v) => {
      let isPass = false;
      if (v === "近半年") {
        isPass = date.isAfter(sixMonthsAgo) && date.isBefore(now);
      }
      if (v === "近一年") {
        isPass = date.isAfter(oneYearAgo) && date.isBefore(now);
      }
      return isPass;
    });
  };

  const handlefeishuData = (data = [], type = "") => {
    // allData有值就是初始化时全选，没值就是正常逻辑选择时
    let _selectedProjTags = type === "proj" ? data : selectedProjTags;
    let _selectedCustTags = type === "cust" ? data : selectedCustTags;
    let _selectedRangeTags = type === "range" ? data : selectedRangeTags;
    let _selectedStatusTags = type === "status" ? data : selectedStatusTags;
    let _selectedOnlyOneTags = type === "onlyOne" ? data : selectedOnlyOneTags;
    let _selectedEndDateTags = type === "endDate" ? data : selectedEndDateTags;
    //   签约项目 对方签约公司 [] 发行权利 []
    const _currentFeishuData = feishuDataRef.current
      .filter((v) => !!v?.fields?.["签约项目"])
      .map((v) => ({
        ...v,
        fields: {
          ...v.fields,
          对方签约公司: v.fields?.["对方签约公司"] || [],
          发行权利: v.fields?.["发行权利"] || [],
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
            v?.fields?.["发行权利"]?.some?.((value) =>
              _selectedRangeTags.includes(value)
            ) ||
            (v?.fields?.["发行权利"].length === 0 &&
              _selectedRangeTags.length === 0)) &&
          // 状态
          (_selectedStatusTags.length === 0 ||
            _selectedStatusTags.includes(v?.fields?.["项目状态"])) &&
          // 独家
          (_selectedOnlyOneTags.length === 0 ||
            _selectedOnlyOneTags.includes(v?.fields?.["是否独家签约"])) &&
          // 到期时间
          (_selectedEndDateTags.length === 0 ||
            verifyTime(_selectedEndDateTags, v?.fields?.["到期时间"]))
      );
    setCurrentFeishuData(_currentFeishuData);
  };

  const handleIssuanceRightsChange = (tag, checked) => {
    setIssuanceRights(checked ? [tag] : []);
  };
  const handleChange = (tag, checked, type) => {
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
    if (type === "status") {
      const nextSelectedTags = checked
        ? [...selectedStatusTags, tag]
        : selectedStatusTags.filter((t) => t !== tag);
      setSelectedStatusTags(nextSelectedTags);
      handlefeishuData(nextSelectedTags, "status");
    }
    if (type === "onlyOne") {
      const nextSelectedTags = checked
        ? [...selectedOnlyOneTags, tag]
        : selectedOnlyOneTags.filter((t) => t !== tag);
      setSelectedOnlyOneTags(nextSelectedTags);
      handlefeishuData(nextSelectedTags, "onlyOne");
    }
    if (type === "endDate") {
      const nextSelectedTags = checked
        ? [...selectedEndDateTags, tag]
        : selectedEndDateTags.filter((t) => t !== tag);
      setSelectedEndDateTags(nextSelectedTags);
      handlefeishuData(nextSelectedTags, "endDate");
    }
    // 项目签约情况
    if (type === "projStatus") {
      // const nextSelectedTags = checked
      //   ? [...selectedProjStatusTags, tag]
      //   : selectedProjStatusTags.filter((t) => t !== tag);
      // setSelectedProjStatusTags(nextSelectedTags);
      // // handlefeishuData(nextSelectedTags, "proj");

      const nextSelectedTags = checked ? [tag] : [];
      setSelectedProjStatusTags(nextSelectedTags);
      // handlefeishuData(nextSelectedTags, "proj");
    }
    // 项目签约情况
    if (type === "rangeStatus") {
      // const nextSelectedTags = checked
      //   ? [...selectedProjStatusTags, tag]
      //   : selectedProjStatusTags.filter((t) => t !== tag);
      // setSelectedProjStatusTags(nextSelectedTags);
      // // handlefeishuData(nextSelectedTags, "proj");

      const nextSelectedTags = checked ? [tag] : [];
      setSelectedRangeStatusTags(nextSelectedTags);
      // handlefeishuData(nextSelectedTags, "proj");
    }
  };
  const onClickonDrawerOpen = (index) => {
    const _isDrawerOpens = [...isDrawerOpens];
    _isDrawerOpens[index] = !_isDrawerOpens[index];
    setIsDrawerOpens(_isDrawerOpens);
  };

  // 控制 地区可发行权利 div的top
  useEffect(() => {
    const bottom = document.querySelector(".bottom");
    const bottom2 = document.querySelector(".bottom2");
    const Height = bottom.offsetHeight;
    bottom2.style.top = `${Height + 12 + 6}px`;
  }, [selectedArea, selectedProjStatusTags, isDrawerOpens]);

  // 控制 项目信息 div的top
  useEffect(() => {
    const bottom = document.querySelector(".bottom");
    const bottom2 = document.querySelector(".bottom2");
    const top = document.querySelector(".top");
    const Height = bottom.offsetHeight;
    const Height2 = bottom2.offsetHeight;
    top.style.top = `${Height + Height2 + 12 + 6 + 6}px`;
  }, [selectedArea, selectedProjStatusTags, isDrawerOpens, issuanceRights]);

  // 计算是否独家
  const calDuJia = () => {
    const _data = feishuDataRef.current.filter((v) =>
      selectedProjStatusTags.includes(v.fields["签约项目"])
    );
    console.log(_data);
    const duJia = [];
    const feiDuJia = [];
    _data.forEach((v) => {
      if (v?.fields?.["是否独家签约"] === "独家") {
        duJia.push(...(v?.fields?.["发行权利"] || []));
      } else {
        feiDuJia.push(...(v?.fields?.["发行权利"] || []));
      }
    });
    // 去重
    const _duJia = duJia.reduce(
      (acc, item) => (acc.includes(item) ? acc : [...acc, item]),
      []
    );
    const _feiDuJia = feiDuJia.reduce(
      (acc, item) => (acc.includes(item) ? acc : [...acc, item]),
      []
    );
    console.log(_duJia);
    console.log(_feiDuJia);
    // 去除独家里又有非独家的情况
    const __feiDuJia = _feiDuJia.filter((v) => !_duJia.includes(v));
    console.log(__feiDuJia);
    setDuJia(_duJia);
    setFeiDuJia(__feiDuJia);
    // const data = _data?.[0]?.fields?.["发行权利"];
  };
  // 计算签约状态
  const calProjStatus = () => {
    let okProjStatus = [];
    let goalProjStatus = [];
    let ingProjStatus = [];
    feishuDataRef.current
      .filter((v) => v?.fields?.["授权区域"]?.includes(selectedArea))
      .map((v) => v.fields["签约项目"])
      .reduce((acc, item) => (acc.includes(item) ? acc : [...acc, item]), []) // 去重
      .map((item) => {
        const data = feishuDataRef.current.find(
          (v) => v.fields["签约项目"] === item
        )?.fields?.["项目状态"];
        if (data === "已签约") {
          okProjStatus.push(item);
        }
        if (data === "目标") {
          goalProjStatus.push(item);
        }
        if (data === "跟进中") {
          ingProjStatus.push(item);
        }
      });
      setOkProjStatus(okProjStatus)
      setGoalProjStatus(goalProjStatus)
      setIngProjStatus(ingProjStatus)
  };

  useEffect(() => {
    calDuJia();
  }, [selectedProjStatusTags]);
  useEffect(() => {
    calProjStatus();
  }, [selectedArea]);

  // 排序
  const orderData = (data, ...params) => {
    const list = [];
    params.forEach((item) => {
      list.push(...data.filter((v) => item.includes(v)));
    });
    list.push(...data.filter((v) => !list.includes(v)));
    return list;
  };

  return (
    <div className="page">
      <div
        className="area title"
        style={
          isMobileDevice
            ? {
                top: "12px",
                fontSize: "15px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "auto",
                padding: "8px 16px",
              }
            : {}
        }
      >
        <img src={lemonIcon} alt="" />
        柠萌海外发行情况
      </div>
      <div
        className="left"
        style={{ height: isDrawerOpens[0] ? "calc(100% - 44px)" : "16px" }}
      >
        <span className="title">
          <span style={{ display: isDrawerOpens[0] ? "inline-block" : "none" }}>
            <img src={lemonIcon} alt="" />
            筛选条件
          </span>
          <span className="drawer_icon" onClick={() => onClickonDrawerOpen(0)}>
            {isDrawerOpens[0] ? (
              <MenuFoldOutlined width={"10px"} />
            ) : (
              <MenuUnfoldOutlined width={10} />
            )}
          </span>
        </span>
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
          <Card title="客户">
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
          <Card title="项目状态">
            {statusData.map((item) => (
              <Tag.CheckableTag
                key={item}
                checked={selectedStatusTags.includes(item)}
                onChange={(checked) => handleChange(item, checked, "status")}
                color="red"
              >
                {item}
              </Tag.CheckableTag>
            ))}
          </Card>
          <Card title="发行权利">
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
          <Card title="是否独家签约">
            {onlyOneData.map((item) => (
              <Tag.CheckableTag
                key={item}
                checked={selectedOnlyOneTags.includes(item)}
                onChange={(checked) => handleChange(item, checked, "onlyOne")}
                color="red"
              >
                {item}
              </Tag.CheckableTag>
            ))}
          </Card>
          <Card title="签约到期时间">
            {endDateData.map((item) => (
              <Tag.CheckableTag
                key={item}
                checked={selectedEndDateTags.includes(item)}
                onChange={(checked) => handleChange(item, checked, "endDate")}
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
        <div
          className="bottom bottomTag"
          style={{
            // height: isDrawerOpens[1] ? "428px" : "auto",
            // display: isDrawerOpens[1] ? "block" : "none",
            width: isDrawerOpens[1]
              ? isMobileDevice
                ? "88%"
                : "410px"
              : "auto",
          }}
        >
          <p className="title">
            <img
              src={lemonIcon}
              alt=""
              style={{
                display: isDrawerOpens[1] ? "inline-block" : "none",
              }}
            />
            <span
              style={{
                display: isDrawerOpens[1] ? "inline-block" : "none",
              }}
            >
              项目签约情况&nbsp;
            </span>
            <span
              className="proj-status"
              style={{
                display: isDrawerOpens[1] ? "inline-block" : "none",
                verticalAlign: "middle",
              }}
            >
              <Tag.CheckableTag
                key={"trust"}
                style={{ backgroundColor: COLOR.blue }}
              >
                <img src={goal} alt="" width={16} />
                目标
              </Tag.CheckableTag>
              <Tag.CheckableTag
                key={"run"}
                style={{ backgroundColor: COLOR.yellow }}
              >
                <img src={run} alt="" width={16} /> 跟进中
              </Tag.CheckableTag>
              <Tag.CheckableTag
                key={"trust"}
                style={{ backgroundColor: COLOR.green }}
              >
                <img src={trustIcon} alt="" width={16} />
                已签约
              </Tag.CheckableTag>
              <Tag.CheckableTag
                key={"unknow"}
                style={{ backgroundColor: COLOR.red }}
              >
                <img src={unknow} alt="" width={14} />
                过期
              </Tag.CheckableTag>
            </span>
            <span
              className="drawer_icon"
              onClick={() => onClickonDrawerOpen(1)}
            >
              {isDrawerOpens[1] ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </span>
          </p>
          <div
            id="projectSigningStatus"
            style={{
              display: isDrawerOpens[1] ? "block" : "none",
            }}
          >
            {
              orderData(feishuDataRef.current
                .filter((v) => v?.fields?.["授权区域"]?.includes(selectedArea))
                .map((v) => v.fields["签约项目"])
                .reduce(// 去重
                  (acc, item) => (acc.includes(item) ? acc : [...acc, item]),
                  []
                ) , goalProjStatus, ingProjStatus,okProjStatus)
              .map((item, i) => {
                const data = feishuDataRef.current.find(
                  (v) => v.fields["签约项目"] === item
                )?.fields?.["项目状态"];
                return (
                  <Tag.CheckableTag
                    key={item + i}
                    checked={selectedProjStatusTags.includes(item)}
                    onChange={(checked) => {
                      handleChange(item, checked, "projStatus");
                      setIssuanceRights([]);
                    }}
                    color="red"
                    style={{
                      backgroundColor:
                        data === "已签约"
                          ? selectedProjStatusTags.includes(item)
                            ? COLOR.green_selected
                            : COLOR.green
                          : data === "目标"
                          ? selectedProjStatusTags.includes(item)
                            ? COLOR.blue_selected
                            : COLOR.blue
                          : data === "跟进中"
                          ? selectedProjStatusTags.includes(item)
                            ? COLOR.yellow_selected
                            : COLOR.yellow
                          : selectedProjStatusTags.includes(item)
                          ? COLOR.red_selected
                          : COLOR.red,
                    }}
                  >
                    <div>
                      {item}
                      {data === "已签约" ? (
                        <img
                          src={
                            selectedProjStatusTags.includes(item)
                              ? trustIcon_white
                              : trustIcon
                          }
                          alt=""
                          width={16}
                        />
                      ) : data === "目标" ? (
                        <img
                          src={
                            selectedProjStatusTags.includes(item)
                              ? goal_white
                              : goal
                          }
                          alt=""
                          width={16}
                        />
                      ) : data === "跟进中" ? (
                        <img
                          src={
                            selectedProjStatusTags.includes(item)
                              ? run_white
                              : run
                          }
                          alt=""
                          width={16}
                        />
                      ) : (
                        <img
                          src={
                            selectedProjStatusTags.includes(item)
                              ? unknow_white
                              : unknow
                          }
                          alt=""
                          width={14}
                        />
                      )}
                    </div>
                  </Tag.CheckableTag>
                );
              })}
          </div>
        </div>
        <div
          className="bottom2 bottomTag"
          style={{
            display: isDrawerOpens[1] ? "block" : "none",
            width: isDrawerOpens[1]
              ? isMobileDevice
                ? "88%"
                : "410px"
              : "none",
          }}
        >
          <p className="title">
            <img src={lemonIcon} alt="" />
            该地区可发行权利&nbsp;
            <span
              style={{
                verticalAlign: "middle",
              }}
            >
              <Tag.CheckableTag
                key={"unCooperation"}
                checked={issuanceRights.includes("2")}
                onChange={(checked) => handleIssuanceRightsChange("2", checked)}
                style={{
                  backgroundColor: issuanceRights.includes("2")
                    ? COLOR.red_selected
                    : COLOR.red,
                }}
              >
                <img
                  src={issuanceRights.includes("2") ? unknow_white : unknow}
                  alt=""
                  width={14}
                />
                未合作
              </Tag.CheckableTag>
              <Tag.CheckableTag
                key={"unExclusive"}
                checked={issuanceRights.includes("1")}
                onChange={(checked) => handleIssuanceRightsChange("1", checked)}
                style={{
                  backgroundColor: issuanceRights.includes("1")
                    ? COLOR.yellow_selected
                    : COLOR.yellow,
                }}
              >
                <img
                  src={
                    issuanceRights.includes("1") ? trustIcon_white : trustIcon
                  }
                  alt=""
                  width={16}
                />
                非独家
              </Tag.CheckableTag>
              <Tag.CheckableTag
                key={"exclusive"}
                checked={issuanceRights.includes("0")}
                onChange={(checked) => handleIssuanceRightsChange("0", checked)}
                style={{
                  backgroundColor: issuanceRights.includes("0")
                    ? COLOR.green_selected
                    : COLOR.green,
                }}
              >
                <img
                  src={issuanceRights.includes("0") ? du_jia_white : du_jia}
                  alt=""
                  width={18}
                  style={{ marginTop: "-2px" }}
                />
                独家
              </Tag.CheckableTag>
            </span>
          </p>
          <div id="issueRight">
            {selectedProjStatusTags.length > 0 &&
              orderData(publishData, duJia, feiDuJia)
                .reverse()
                .filter((v) => {
                  if (issuanceRights.length === 0) {
                    return true;
                  }
                  if (issuanceRights.includes("0")) {
                    return duJia?.includes(v);
                  }
                  if (issuanceRights.includes("1")) {
                    return feiDuJia?.includes(v);
                  }
                  if (issuanceRights.includes("2")) {
                    return !feiDuJia?.includes(v) && !duJia?.includes(v);
                  }
                })
                .map((item, i) => {
                  return (
                    <Tag.CheckableTag
                      key={item + i}
                      checked={selectedRangeStatusTags.includes(item)}
                      // onChange={(checked) =>
                      //   handleChange(item, checked, "rangeStatus")
                      // }
                      style={{
                        backgroundColor: duJia?.includes(item)
                          ? "#d9f7be"
                          : feiDuJia?.includes(item)
                          ? "#fff1b8"
                          : "#ffccc7",
                      }}
                    >
                      <div>
                        {item}
                        {duJia?.includes(item) ? (
                          <img
                            src={du_jia}
                            alt=""
                            width={18}
                            style={{ marginLeft: "2px" }}
                          />
                        ) : feiDuJia?.includes(item) ? (
                          <img
                            src={trustIcon}
                            alt=""
                            width={16}
                            style={{ marginLeft: "2px" }}
                          />
                        ) : (
                          <img
                            src={unknow}
                            alt=""
                            width={14}
                            style={{ marginLeft: "2px" }}
                          />
                        )}
                      </div>
                    </Tag.CheckableTag>
                  );
                })}
          </div>
        </div>
        <div
          className="top"
          style={{
            display: isDrawerOpens[1] ? "block" : "none",
            width: isDrawerOpens[1]
              ? isMobileDevice
                ? "88%"
                : "410px"
              : "auto",
          }}
        >
          <p className="title">
            <span
              style={{ display: isDrawerOpens[1] ? "inline-block" : "none" }}
            >
              <img src={lemonIcon} alt="" />
              项目信息&nbsp;&nbsp;&nbsp;
              {selectedArea}
            </span>
          </p>
          <div
            id="message"
            className="message"
            style={{
              display: isDrawerOpens[1] ? "block" : "none",
            }}
          >
            <Tabs
              defaultActiveKey="1"
              items={feishuDataRef.current
                .filter(
                  (v) =>
                    !selectedProjStatusTags.length ||
                    selectedProjStatusTags.includes(v?.fields?.["签约项目"])
                  //  &&                      v?.fields?.["项目状态"] === "已签约"
                )
                .filter(
                  (v) =>
                    !selectedRangeStatusTags.length ||
                    v?.fields?.["发行权利"].includes(selectedRangeStatusTags[0])
                )
                .filter((v) => v?.fields?.["授权区域"]?.includes(selectedArea))
                .map((data, i) => ({
                  key: String(i),
                  label: data?.fields?.["签约项目"],
                  children: (
                    <div className="mouse_message">
                      <p>客户名称：{data?.fields?.["对方签约公司"]}</p>
                      <p>
                        签约日期：
                        {data?.fields?.["合同签约时间"] &&
                          new Date(
                            data?.fields?.["合同签约时间"]
                          ).toLocaleDateString()}
                        &nbsp;&nbsp; 到期日期：
                        {data?.fields?.["到期时间"] &&
                          new Date(
                            data?.fields?.["到期时间"]
                          ).toLocaleDateString()}
                      </p>
                      <p>发行权利：{data?.fields?.["发行权利"]?.toString()}</p>
                      <p>发行平台：{data?.fields?.["发行平台"]?.toString()}</p>
                      <p>
                        {data?.fields?.["项目状态"]}
                        &nbsp;&nbsp; {data?.fields?.["是否独家签约"]}
                        &nbsp;&nbsp; 单集价格：$
                        {data?.fields?.["美元单集价格"]?.toLocaleString()}
                      </p>
                    </div>
                  ),
                }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// const MemoPage = React.memo(Page);

export default Page;
