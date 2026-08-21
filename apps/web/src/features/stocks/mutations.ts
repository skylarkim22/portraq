import { useMutation } from "@tanstack/react-query";
import type { Asset, Market } from "@portraq/lib/types";
import { getTickerColor } from "@portraq/lib/utils";
import { createClient } from "@/lib/supabase/client";

export type CreateCustomAssetInput = {
  userId: string;
  name: string;
  market: Market;
};

export type CustomAsset = Asset & { isCustom: true };

// 검색에 없는 종목을 사용자가 이름·시장만 입력해 custom_assets에 등록한다.
// 생성 즉시 결과가 필요한 단발성 액션이라 낙관적 업데이트는 적용하지 않는다.
export const useCreateCustomAsset = () => {
  return useMutation({
    mutationFn: async (input: CreateCustomAssetInput): Promise<CustomAsset> => {
      const { data, error } = await createClient()
        .from("custom_assets")
        .insert({
          user_id: input.userId,
          name: input.name,
          market: input.market,
          color: getTickerColor(input.name),
        })
        .select("id, name, market, color")
        .single();
      if (error) throw error;

      return {
        ticker: data.id,
        name: data.name,
        market: data.market as Market,
        color: data.color,
        isActive: true,
        dividendFrequency: null,
        dividendMonths: null,
        isCustom: true,
      };
    },
  });
};
