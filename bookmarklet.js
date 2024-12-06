(async () => {
  const nAllViewer = document.getElementById("nAllViewer");

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const giftSubscription = async (szRecvId) => {
    try {
      const options = {
        method: "GET",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
        },
        credentials: "include",
      };

      const { nBroadNo, szBjId } = liveView.LiveViewInfo;
      const body = new URLSearchParams({
        szSendType: Math.random(),
        szRecvId,
        nBroadNo,
        szSubscriptionBj: szBjId,
      });
      const createCode = await fetch(
        `${ST_AFREECATV}/api/item/subscription.php?szWork=createCode`,
        {
          ...options,
          method: "POST",
          body,
        }
      );
      if (!createCode.ok) {
        return;
      }
      const code = await createCode.json();
      if (code.RESULT !== 1 || !code.MSG) {
        return;
      }

      const params = new URLSearchParams({
        szWork: "sendItem",
        szFileType: "json",
        szData: code.MSG,
        szRecvId,
        szChatId: liveView.ChatInfo.myUserInfo.szUserChatId,
        szSubscriptionBj: szBjId,
        nBroadNo,
        nItemType: "__ITEM_TYPE__",
        broad_no: nBroadNo,
        sys_type: "html5",
        location: "live",
      });
      const sendItem = await fetch(
        `${ST_AFREECATV}/api/item/subscription.php?${params.toString()}`,
        options
      );
      if (!sendItem.ok) {
        return;
      }
      const result = await sendItem.json();
      if (result.RESULT !== 1 || result.FAIL_CNT || result.FAIL_LIST) {
        return;
      }
      return `선물 성공: ${szRecvId}`;
    } catch (e) {}
  };

  const getList = async (tries = 0) => {
    if (tries % 8 === 0) {
      liveView.playerController.sendChUser();
      await wait(300);
    }
    const listLayer = liveView.Chat.chatUserListLayer;
    const chatCount = Object.values(listLayer.userListSeparatedByGrade).reduce(
      (acc, cur) => acc + Object.keys(cur).length - 1,
      0
    );
    const viewerCount = Number(nAllViewer.textContent.replace(/,/g, "")) || 5;
    if (chatCount < 0.5 * viewerCount) {
      if (tries > 100) {
        return;
      }
      return wait(100).then(() => getList(tries + 1));
    }
    return listLayer.getUserListForSDK();
  };

  const getRandom = (arr, n) => {
    const result = new Array(n);
    let len = arr.length;
    const taken = new Array(len);
    while (n--) {
      const x = Math.floor(Math.random() * len);
      result[n] = arr[x in taken ? taken[x] : x];
      taken[x] = --len in taken ? taken[len] : len;
    }
    return result;
  };

  liveView.Chat.showToastMsg?.("참여자 목록을 가져오는 중입니다.");
  const userList = await getList();
  if (userList == null) {
    alert("참여자 목록을 가져오는데 실패했습니다.");
    return;
  }

  const TYPE_MAP = {
    매니저: "manager",
    열혈팬: "hot",
    구독팬: "subscription",
    팬: "fan",
    서포터: "supporter",
    일반: "normal",
  };
  const types = prompt(
    "선물할 대상을 콤마로 구분하여 입력해주세요.\n(매니저, 열혈팬, 구독팬, 팬, 서포터, 일반)"
  );
  const num = Number(prompt("선물할 인원을 입력해주세요."));
  if (isNaN(num) || num < 1) {
    alert("잘못된 인원입니다.");
    return;
  }
  let list = [];
  for (const t of types.split(",")) {
    const l = userList[TYPE_MAP[t.trim()]];
    if (l != null) {
      list = list.concat(l);
    }
  }
  if (list.length === 0) {
    alert("대상이 없습니다.");
    return;
  }

  liveView.Chat.showToastMsg?.("선물 중입니다.");
  const giftList = list.length <= num ? list : getRandom(list, num);
  const giftSet = new Set(giftList.map((user) => user.id.split("(")[0]));
  const result = [];
  for (const user of giftSet) {
    result.push((await giftSubscription(user)) || `선물 실패: ${user}`);
    await wait(100);
  }
  alert(result.join("\n"));
})().catch(() => {
  alert("오류가 발생했습니다.");
});
