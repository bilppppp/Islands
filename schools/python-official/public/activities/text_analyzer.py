"""Python 官方教程第 1 至 12 章综合实战脚本：文本分析与统计

演示全教程核心功能串联：
1. 模块与入口判断 (__name__ == '__main__')
2. 函数定义与文档字符串 (def, docstring, 默认参数)
3. 数据结构综合运用 (字符串切片与清洗、列表收集、字典词频统计)
4. 异常处理 (try...except FileNotFoundError, OSError)
5. 文件输入输出 (with open(..., 'r'/'w', encoding='utf-8'))
6. 标准库实用模块 (sys.argv, os.path)
"""

import sys
import os

def clean_word(token):
    """去除单词周围的标点符号并转为小写。"""
    return token.strip(".,!?;:\"'()[]{}").lower()

def count_word_frequencies(words):
    """使用字典整理并统计各个单词出现的频次。"""
    freq_map = {}
    for word in words:
        if not word:
            continue
        freq_map[word] = freq_map.get(word, 0) + 1
    return freq_map

def filter_by_min_length(freq_map, min_len=4):
    """筛选出长度大于等于 min_len 的单词列表，并按频次降序排序。"""
    filtered = []
    for word, count in freq_map.items():
        if len(word) >= min_len:
            filtered.append((word, count))
    
    # 按照频次从高到低排序
    filtered.sort(key=lambda item: item[1], reverse=True)
    return filtered

def process_text_file(input_path, output_path, min_len=4):
    """读取文本文件，整理统计词频，将长单词高频词结果写入目标文件。"""
    try:
        with open(input_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"[错误] 无法找到输入文件: {input_path}")
        return False
    except OSError as err:
        print(f"[系统错误] 读取文件失败: {err}")
        return False

    raw_tokens = content.split()
    cleaned_words = [clean_word(t) for t in raw_tokens]
    freq = count_word_frequencies(cleaned_words)
    top_words = filter_by_min_length(freq, min_len=min_len)

    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(f"=== 文本词频分析报告 (总词数: {len(cleaned_words)}) ===\n")
            f.write(f"长度 >= {min_len} 的单词统计如下:\n")
            for word, count in top_words:
                f.write(f"{word}: {count} 次\n")
        print(f"[成功] 分析报告已保存到: {output_path}")
        return True
    except OSError as err:
        print(f"[系统错误] 写入报告失败: {err}")
        return False

if __name__ == '__main__':
    # 默认创建演示测试文本
    sample_filename = "sample.txt"
    output_filename = "report.txt"

    sample_content = (
        "Python is an easy to learn, powerful programming language. "
        "It has efficient high-level data structures and a simple but effective approach to object-oriented programming. "
        "Python's elegant syntax and dynamic typing, together with its interpreted nature, make it an ideal language "
        "for scripting and rapid application development in many areas on most platforms."
    )

    with open(sample_filename, 'w', encoding='utf-8') as f:
        f.write(sample_content)

    print("已生成样例文件，开始执行文本分析...")
    success = process_text_file(sample_filename, output_filename, min_len=4)
    if success and os.path.exists(output_filename):
        with open(output_filename, 'r', encoding='utf-8') as f:
            print("\n" + f.read())
