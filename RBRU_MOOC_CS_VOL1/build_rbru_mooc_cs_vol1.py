#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
RBRU MOOC Course Builder Engine for CS_Vol1:
Computing Science 1: Computational Thinking and Unplugged Coding
Course Code: 4011101 การคิดเชิงคำนวณและขั้นตอนวิธีพื้นฐาน
Author: Assistant Professor Dr. Chewa Thassana • Rambhai Barni Rajabhat University
"""

import os
import json
import re

MOOC_DIR = "/Applications/XAMPP/xamppfiles/htdocs/CS2027/RBRU_MOOC_CS_VOL1"
COVERS_DIR = os.path.join(MOOC_DIR, "covers")
SIMS_DIR = os.path.join(MOOC_DIR, "simulators")
MOODLE_DIR = os.path.join(MOOC_DIR, "moodle_export")

os.makedirs(COVERS_DIR, exist_ok=True)
os.makedirs(SIMS_DIR, exist_ok=True)
os.makedirs(MOODLE_DIR, exist_ok=True)

CHAPTERS_DATA = [
    {
        "num": 1,
        "title": "ศาสตร์แห่งวิทยาการคำนวณและกระบวนทัศน์การคิดในศตวรรษที่ 21",
        "theme": "state_space_and_logic",
        "accent": "#00f0ff",
        "formula": "S_0 \\xrightarrow{\\mathcal{T}} S_G \\quad \\text{Optimal 7 Steps}",
        "subtopics": [
            {
                "num": 1,
                "title": "ปริศนาข้ามแม่น้ำเชิงตรรกะและการสำรวจปริภูมิสถานะ",
                "formula": "Danger = (W \\land S \\land \\neg M) \\lor (S \\land C \\land \\neg M)",
                "desc": "การจำลองการค้นหาเส้นทางในปริภูมิสถานะ (State Space Search) และการตั้งเงื่อนไขบูลีนป้องกันอันตราย",
                "icon": "🌊"
            },
            {
                "num": 2,
                "title": "ผังต้นไม้ย่อยปัญหาและสถาปัตยกรรมเชิงโมดูล",
                "formula": "\\text{System} = \\bigoplus_{i=1}^k \\text{Module}_i",
                "desc": "การสลายระบบใหญ่ให้เป็นโมดูลย่อยที่มีขอบเขตหน้าที่ชัดเจนตามหลักการสถาปัตยกรรมซอฟต์แวร์",
                "icon": "🌳"
            },
            {
                "num": 3,
                "title": "เครื่องวิเคราะห์แบบรูปและสกัดคุณลักษณะไม่แปรเปลี่ยน",
                "formula": "I(x) = \\mathcal{F}(\\phi(x)) \\quad \\text{Invariant Feature}",
                "desc": "การตรวจจับแนวโน้ม ความคล้ายคลึง และคุณสมบัติคงตัวในชุดข้อมูลเพื่อการลดรูปปัญหา",
                "icon": "🔍"
            },
            {
                "num": 4,
                "title": "การกรองสาระสำคัญเชิงนามธรรมและแบบจำลองกล่องดำ",
                "formula": "\\mathcal{A}: \\mathcal{X} \\to \\mathcal{Z} \\quad (|\\mathcal{Z}| \\ll |\\mathcal{X}|)",
                "desc": "การซ่อนรายละเอียดส่วนเกินและคงไว้เฉพาะตัวแปรสาระสำคัญสำหรับการแก้ปัญหาเชิงระบบ",
                "icon": "📦"
            },
            {
                "num": 5,
                "title": "สตูดิโอออกแบบโฟลว์ชาร์ตและเครื่องทดสอบขั้นตอนวิธี",
                "formula": "T(n) = \\mathcal{O}(n) \\quad \\text{Loop Invariant}",
                "desc": "การจำลองการทำงานของผังงานเชิงโต้ตอบ การตรวจสอบเงื่อนไข และการพิสูจน์จุดสิ้นสุดของอัลกอริทึม",
                "icon": "⚡"
            }
        ]
    },
    {
        "num": 2,
        "title": "เสาหลักที่ 1 การแยกส่วนประกอบและการย่อยปัญหา",
        "theme": "decomposition",
        "accent": "#10b981",
        "formula": "\\mathcal{P} = \\{p_1, p_2, \\dots, p_k\\} \\quad \\text{Divide and Conquer}",
        "subtopics": [
            {
                "num": 1,
                "title": "การย่อยระบบคอมพิวเตอร์และวงจรอิเล็กทรอนิกส์",
                "formula": "\\text{CPU} = \\text{ALU} \\cup \\text{CU} \\cup \\text{Registers}",
                "desc": "การจำลองการแยกชิ้นส่วนฮาร์ดแวร์คอมพิวเตอร์เพื่อทำความเข้าใจปฏิสัมพันธ์ระหว่างบัสข้อมูลและหน่วยประมวลผล",
                "icon": "💻"
            },
            {
                "num": 2,
                "title": "การสลายปัญหาทางฟิสิกส์และการแยกแยะเวกเตอร์แรง",
                "formula": "\\vec{F} = F_x\\hat{i} + F_y\\hat{j} \\quad (F_x = F\\cos\\theta)",
                "desc": "การวิเคราะห์แรงบนพื้นเอียงและการจำลองการเคลื่อนที่สองมิติด้วยการแยกส่วนประกอบพิกัดฉาก",
                "icon": "⚖️"
            },
            {
                "num": 3,
                "title": "การย่อยฟังก์ชันและขั้นตอนการทำงานแบบโมดูลาร์",
                "formula": "f(x) = g(h(x)) \\quad \\text{Functional Decomposition}",
                "desc": "การแปลงงานขนาดใหญ่เป็นฟังก์ชันอิสระที่มีพารามิเตอร์ส่งผ่านและค่าส่งกลับที่รัดกุม",
                "icon": "🧩"
            },
            {
                "num": 4,
                "title": "การสลายขั้นตอนการแก้โจทย์คณิตศาสตร์เชิงคำนวณ",
                "formula": "\\nabla^2 \\phi = \\frac{\\partial^2 \\phi}{\\partial x^2} + \\frac{\\partial^2 \\phi}{\\partial y^2}",
                "desc": "การแบ่งโจทย์สมการอนุพันธ์ให้กลายเป็นระเบียบวิธีผลต่างอันตะ (Finite Difference) ย่อยๆ",
                "icon": "📐"
            },
            {
                "num": 5,
                "title": "ห้องปฏิบัติการย่อยระบบสมาร์ตฟาร์มพืชผล",
                "formula": "\\text{Farm IoT} = \\text{Sensor} + \\text{Edge AI} + \\text{Actuator}",
                "desc": "การจำลองระบบเกษตรแม่นยำและการแยกแยะวงจรควบคุมปั๊มน้ำ โซลินอยด์วาล์ว และการวัดธาตุอาหาร",
                "icon": "🌱"
            }
        ]
    },
    {
        "num": 3,
        "title": "เสาหลักที่ 2 การหารูปแบบและความสัมพันธ์ของข้อมูล",
        "theme": "pattern_recognition",
        "accent": "#f59e0b",
        "formula": "F_n = F_{n-1} + F_{n-2} \\quad \\lim_{n\\to\\infty} \\frac{F_n}{F_{n-1}} = \\phi",
        "subtopics": [
            {
                "num": 1,
                "title": "การตรวจจับแบบรูปอนุกรมตัวเลขและลำดับฟีโบนัชชี",
                "formula": "a_n = a_1 + (n-1)d \\quad a_n = a_1 r^{n-1}",
                "desc": "การสำรวจลำดับตัวเลขทางคณิตศาสตร์ สัดส่วนทองคำ และการค้นพบกฎเกณฑ์การเพิ่มขึ้นของข้อมูล",
                "icon": "🔢"
            },
            {
                "num": 2,
                "title": "การวิเคราะห์แนวโน้มข้อมูลสภาพอากาศและอุณหภูมิ",
                "formula": "y = mx + c \\quad R^2 = 1 - \\frac{SS_{res}}{SS_{tot}}",
                "desc": "การตรวจจับความสัมพันธ์ของความชื้นและอุณหภูมิในแปลงเพาะปลูกด้วยการถดถอยเชิงเส้น",
                "icon": "📈"
            },
            {
                "num": 3,
                "title": "การจำแนกแบบรูปทรงเรขาคณิตและแฟร็กทัล",
                "formula": "D = \\frac{\\log N}{\\log(1/r)} \\quad \\text{Fractal Dimension}",
                "desc": "การสร้างและการวิเคราะห์โครงสร้างเรขาคณิตคล้ายตนเอง (Self-similarity) เช่น สามเหลี่ยมเซียร์พินสกี",
                "icon": "❄️"
            },
            {
                "num": 4,
                "title": "การจับคู่รูปแบบข้อความและขั้นตอนวิธีเคเอ็มพี",
                "formula": "\\pi[q] = \\max \\{k : P_k \\sqsupset P_q\\} \\quad \\mathcal{O}(N+M)",
                "desc": "การค้นหาคำและรูปแบบสายอักขระด้วยตารางฟังก์ชันพาย (Prefix Function) โดยไม่ต้องถอยกลับ",
                "icon": "🔤"
            },
            {
                "num": 5,
                "title": "ห้องปฏิบัติการปัญญาประดิษฐ์จำแนกรูปแบบภาพ",
                "formula": "\\hat{y} = \\text{softmax}(W \\mathbf{x} + b)",
                "desc": "การทดลองจำลองระบบคอมพิวเตอร์วิทัศน์ตรวจจับจุดเด่นของวัตถุและจำแนกท่าทางมือ MediaPipe",
                "icon": "👁️"
            }
        ]
    },
    {
        "num": 4,
        "title": "เสาหลักที่ 3 การคิดเชิงนามธรรมและการกรองสาระสำคัญ",
        "theme": "abstraction",
        "accent": "#8b5cf6",
        "formula": "G = (V, E) \\quad \\text{Topological Invariance}",
        "subtopics": [
            {
                "num": 1,
                "title": "การตัดรายละเอียดส่วนเกินของแผนที่รถไฟฟ้า",
                "formula": "\\text{Topology}(G) \\equiv \\text{Connectivity}(V, E)",
                "desc": "การแปลงแผนที่ภูมิศาสตร์ที่มีความโค้งซับซ้อนให้กลายเป็นผังเชื่อมต่อเชิงทอพอโลยีที่เข้าใจง่าย",
                "icon": "🗺️"
            },
            {
                "num": 2,
                "title": "การสร้างโมเดลตัวแปรและสมการแทนสถานการณ์จริง",
                "formula": "\\frac{dQ}{dt} = k A \\frac{\\Delta T}{\\Delta x} \\quad \\text{Fourier's Law}",
                "desc": "การจำลองการถ่ายเทความร้อนและการไหลของของเหลวโดยลดรูปวัตถุจริงให้เหลือเพียงพารามิเตอร์แกน",
                "icon": "📊"
            },
            {
                "num": 3,
                "title": "การออกแบบชนิดข้อมูลนามธรรมสแต็กและคิว",
                "formula": "\\text{LIFO (Stack)} \\quad \\text{FIFO (Queue)}",
                "desc": "การกำหนดพฤติกรรมการจัดเก็บข้อมูลแบบนามธรรมและการทดสอบการทำงานของหน่วยความจำ",
                "icon": "🥞"
            },
            {
                "num": 4,
                "title": "การกรองสัญญาณรบกวนด้วยฟิลเตอร์ค่าเฉลี่ยเคลื่อนที่",
                "formula": "\\bar{y}_t = \\frac{1}{K} \\sum_{i=0}^{K-1} x_{t-i} \\quad \\text{Noise Reduction}",
                "desc": "การขจัดสัญญาณรบกวนสุ่มออกจากค่าอ่านเซนเซอร์เพื่อสกัดแนวโน้มทางกายภาพที่แท้จริง",
                "icon": "🎛️"
            },
            {
                "num": 5,
                "title": "ห้องปฏิบัติการจำลองแบบจำลองฟิสิกส์วัตถุลดทอน",
                "formula": "m \\frac{d^2 x}{dt^2} + c \\frac{dx}{dt} + k x = 0",
                "desc": "การจำลองการสั่นของมวล-สปริงโดยถือว่าวัตถุเป็นจุดมวลเดี่ยว (Point Mass) ในระบบ 3 มิติ",
                "icon": "🎯"
            }
        ]
    },
    {
        "num": 5,
        "title": "เสาหลักที่ 4 การออกแบบขั้นตอนวิธีและตรรกศาสตร์เบื้องต้น",
        "theme": "algorithms",
        "accent": "#ec4899",
        "formula": "T(n) = a T(n/b) + f(n) \\quad \\text{Master Theorem}",
        "subtopics": [
            {
                "num": 1,
                "title": "ตัวจำลองเกตตรรกะบูลีนและตารางค่าความจริง",
                "formula": "Y = (A \\land B) \\lor (\\neg A \\land C)",
                "desc": "การจำลองตรรกศาสตร์บูลีนระดับเกต AND, OR, NOT, XOR, NAND และการพิสูจน์พีชคณิตบูลีน",
                "icon": "🔲"
            },
            {
                "num": 2,
                "title": "การออกแบบโครงสร้างเลือกทำเชิงเงื่อนไข",
                "formula": "\\text{if } (x > 0) \\text{ then } f(x) \\text{ else } g(x)",
                "desc": "การจำลองการตัดสินใจแบบหลายทางเลือก (Multi-way Branching) และการวิเคราะห์กิ่งเงื่อนไข",
                "icon": "🔀"
            },
            {
                "num": 3,
                "title": "เครื่องทดสอบการวนซ้ำและการตรวจจับลูปอนันต์",
                "formula": "\\forall k, \\quad P(k) \\implies P(k+1) \\quad \\text{Induction}",
                "desc": "การทำความเข้าใจลูป for, while, do-while พร้อมการพิสูจน์การสิ้นสุดด้วยตัวแปรลดลง (Variant)",
                "icon": "🔄"
            },
            {
                "num": 4,
                "title": "รหัสเทียมและการแปลงสู่คำสั่งคอมพิวเตอร์",
                "formula": "\\text{Algorithm: } \\text{Input} \\to \\text{Execution} \\to \\text{Output}",
                "desc": "การเขียนรหัสเทียมที่เป็นทางการตามมาตรฐานสากลและการเชื่อมโยงสู่ภาษาโปรแกรมจริง",
                "icon": "📝"
            },
            {
                "num": 5,
                "title": "ห้องปฏิบัติการออกแบบอัลกอริทึมพาหุ่นยนต์เดินเขาวงกต",
                "formula": "\\text{Right-Hand Rule} \\quad \\mathcal{O}(V + E) \\text{ BFS/DFS}",
                "desc": "การเขียนขั้นตอนวิธีนำทางหุ่นยนต์ค้นหาทางออกจากเขาวงกตด้วยกฎมือขวาและการค้นหาตามแนวกว้าง",
                "icon": "🤖"
            }
        ]
    },
    {
        "num": 6,
        "title": "กิจกรรมอันปลั๊ก 1 ระบบตรรกะ ตารางความจริง และวงจรสวิตช์กระดาษ",
        "theme": "unplugged_circuits",
        "accent": "#06b6d4",
        "formula": "V = IR \\quad \\text{Boolean Paper Circuits}",
        "subtopics": [
            {
                "num": 1,
                "title": "วงจรสวิตช์กระดาษเทปทองแดงอนุกรมแบบ AND",
                "formula": "I > 0 \\iff S_1 = 1 \\land S_2 = 1",
                "desc": "การทดลองประดิษฐ์สวิตช์กระดาษต่ออนุกรม ไฟ LED จะติดเมื่อกดสวิตช์ทั้งสองตัวพร้อมกัน",
                "icon": "💡"
            },
            {
                "num": 2,
                "title": "วงจรสวิตช์กระดาษขนานแบบ OR และตัวกลับสัญญาณ NOT",
                "formula": "I > 0 \\iff S_1 = 1 \\lor S_2 = 1",
                "desc": "การต่อวงจรแบบขนานและการสร้างสวิตช์ปิดเปิดแบบ Normal-Closed เพื่อทำหน้าที่เป็นเกต NOT",
                "icon": "🔌"
            },
            {
                "num": 3,
                "title": "วงจรบวกเลขฐานสองครึ่งตัวเชิงกล",
                "formula": "Sum = A \\oplus B, \\quad Carry = A \\land B",
                "desc": "การประกอบเกต XOR และ AND เข้าด้วยกันบนแผ่นกระดาษเพื่อสร้างวงจรบวกเลขบิตเดี่ยว",
                "icon": "➕"
            },
            {
                "num": 4,
                "title": "บอร์ดเกมปริศนาตรรกศาสตร์ไขรหัสลับ",
                "formula": "C = P_1 \\land P_2 \\land \\dots \\land P_n",
                "desc": "กิจกรรมถอดรหัสกล่องสมบัติโดยอาศัยเบาะแสตรรกศาสตร์บูลีนและการตัดตัวเลือก",
                "icon": "🎲"
            },
            {
                "num": 5,
                "title": "ปฏิบัติการจำลองสถานีเตือนภัยน้ำท่วมระบบตรรกะอันปลั๊ก",
                "formula": "Alarm = (Level_{high} \\land Rain_{heavy}) \\lor Manual",
                "desc": "การจำลองสถานีแจ้งเตือนภัยธรรมชาติด้วยสวิตช์ทุ่นลอยน้ำและกลไกสวิตช์กระดาษ",
                "icon": "🚨"
            }
        ]
    },
    {
        "num": 7,
        "title": "กิจกรรมอันปลั๊ก 2 การแทนรหัสข้อมูล รหัสไบนารี และพิกเซลภาพ",
        "theme": "binary_pixels",
        "accent": "#3b82f6",
        "formula": "N = \\sum_{i=0}^{n-1} b_i 2^i \\quad \\text{Binary Weight Expansion}",
        "subtopics": [
            {
                "num": 1,
                "title": "การ์ดเปิดปิดบิตเลขฐานสอง 8-4-2-1",
                "formula": "13_{10} = 1\\cdot 8 + 1\\cdot 4 + 0\\cdot 2 + 1\\cdot 1 = 1101_2",
                "desc": "การใช้การ์ดจุดตัวเลข 1, 2, 4, 8, 16 เพื่อฝึกแปลงตัวเลขฐานสิบเป็นฐานสองอย่างเห็นภาพจริง",
                "icon": "🃏"
            },
            {
                "num": 2,
                "title": "เครื่องถอดรหัส ASCII สร้อยข้อมือเลขฐานสอง",
                "formula": "'A' = 65_{10} = 01000001_2",
                "desc": "การร้อยลูกปัดสีดำ-ขาวแทนบิต 0 และ 1 เพื่อเข้ารหัสชื่อตนเองเป็นรหัสมาตรฐาน ASCII",
                "icon": "📿"
            },
            {
                "num": 3,
                "title": "ตารางกริดบีบอัดข้อมูลแบบ Run-Length Encoding",
                "formula": "W, B, W, W, W \\implies 1W 1B 3W",
                "desc": "การทดลองบีบอัดข้อมูลข้อความและแถบภาพด้วยการนับจำนวนความยาวช่วงข้อมูลซ้ำ",
                "icon": "🗜️"
            },
            {
                "num": 4,
                "title": "การแทนค่าภาพดิจิทัลและพิกเซลภาพสี RGB",
                "formula": "Pixel = (R, G, B) \\in [0, 255]^3",
                "desc": "การระบายสีบนตารางกริดตามรหัสตัวเลขพิกเซลเพื่อทำความเข้าใจการแสดงผลบนจอภาพ",
                "icon": "🎨"
            },
            {
                "num": 5,
                "title": "ปฏิบัติการกู้คืนข้อมูลพิกเซลที่สูญหายด้วยพาริตี",
                "formula": "P = \\bigoplus_{i=1}^n b_i \\quad \\text{Even Parity Check}",
                "desc": "มายากลการ์ดตารางบิตพาริตีสองมิติที่สามารถระบุตำแหน่งและแก้ไขการ์ดที่ถูกพลิกได้ 100%",
                "icon": "✨"
            }
        ]
    },
    {
        "num": 8,
        "title": "กิจกรรมอันปลั๊ก 3 ขั้นตอนวิธีการค้นหาและการเรียงลำดับด้วยการ์ดเกม",
        "theme": "sorting_searching",
        "accent": "#6366f1",
        "formula": "\\mathcal{O}(\\log n) \\quad \\text{vs} \\quad \\mathcal{O}(n^2) \\quad \\text{Complexity}",
        "subtopics": [
            {
                "num": 1,
                "title": "เกมไพ่ค้นหาเชิงเส้นเทียบกับการค้นหาแบบทวิภาค",
                "formula": "T_{linear} = \\mathcal{O}(n), \\quad T_{binary} = \\mathcal{O}(\\log_2 n)",
                "desc": "การจำลองค้นหาตัวเลขในไพ่ที่เรียงแล้วเทียบกับไพ่ที่สลับมั่วเพื่อประเมินความเร็วในการค้นหา",
                "icon": "🎴"
            },
            {
                "num": 2,
                "title": "ตาชั่งสองแขนจำลองและการเรียงลำดับแบบฟอง",
                "formula": "\\text{Comparisons} = \\frac{n(n-1)}{2} \\quad \\text{Bubble Sort}",
                "desc": "การเปรียบเทียบน้ำหนักสิ่งของทีละคู่บนตาชั่งสองแขนและสลับตำแหน่งจนกว่าจะเรียงจากเบาไปหนัก",
                "icon": "⚖️"
            },
            {
                "num": 3,
                "title": "การเรียงลำดับแบบแทรกด้วยการจัดสำรับไพ่",
                "formula": "\\text{Best} = \\mathcal{O}(n), \\quad \\text{Worst} = \\mathcal{O}(n^2)",
                "desc": "การหยิบการ์ดทีละใบแล้วนำไปแทรกลงในตำแหน่งที่ถูกต้องในมือ เลียนแบบพฤติกรรม Insertion Sort",
                "icon": "🖐️"
            },
            {
                "num": 4,
                "title": "การแข่งขันขั้นตอนวิธีเรียงลำดับแบบผสาน",
                "formula": "T(n) = 2T(n/2) + \\mathcal{O}(n) = \\mathcal{O}(n \\log n)",
                "desc": "การแบ่งกองการ์ดออกเป็นครึ่งหนึ่งเรื่อยๆ แล้วนำกลับมารวมกันอย่างมีระเบียบตามแนวคิด Divide & Conquer",
                "icon": "🏆"
            },
            {
                "num": 5,
                "title": "ปฏิบัติการเปรียบเทียบจำนวนครั้งการเปรียบเทียบ",
                "formula": "\\text{Benchmark Matrix}: \\text{Comparisons} \\& \\text{Swaps}",
                "desc": "การบันทึกสถิติและสร้างกราฟเปรียบเทียบประสิทธิภาพของอัลกอริทึมเรียงลำดับในสภาพจริง",
                "icon": "📊"
            }
        ]
    },
    {
        "num": 9,
        "title": "กิจกรรมอันปลั๊ก 4 โครงข่าย การนำทาง และกราฟในชีวิตประจำวัน",
        "theme": "graph_networks",
        "accent": "#14b8a6",
        "formula": "G = (V, E) \\quad \\sum_{v\\in V} \\deg(v) = 2|E| \\quad \\text{Handshaking Lemma}",
        "subtopics": [
            {
                "num": 1,
                "title": "ปริศนาสะพานทั้งเจ็ดแห่งเมืองโคนิกส์แบร์ก",
                "formula": "\\text{Eulerian Path} \\iff \\text{Odd Degree Vertices} \\in \\{0, 2\\}",
                "desc": "การพิสูจน์การเดินผ่านสะพานทุกแห่งเพียงครั้งเดียวของเลอ็อนฮาร์ท ออยเลอร์ จุดกำเนิดทฤษฎีกราฟ",
                "icon": "🌉"
            },
            {
                "num": 2,
                "title": "การหาเส้นทางสั้นที่สุดด้วยขั้นตอนวิธีไดจ์กสตรา",
                "formula": "d(v) = \\min(d(v), d(u) + w(u, v)) \\quad \\text{Dijkstra Algorithm}",
                "desc": "การใช้เส้นเชือกดึงระหว่างหมุดจุดยอดเพื่อหาเส้นทางที่สั้นที่สุดทางกายภาพในเครือข่าย",
                "icon": "🧶"
            },
            {
                "num": 3,
                "title": "ต้นไม้ทอดข้ามต่ำสุดของพริมเพื่อวางท่อน้ำประปา",
                "formula": "\\text{MST Weight} = \\min \\sum_{e\\in T} w(e) \\quad \\text{Greedy Prim/Kruskal}",
                "desc": "การคำนวณเชื่อมต่อท่อน้ำไปยังบ้านทุกหลังด้วยต้นทุนรวมของความยาวท่อที่ประหยัดที่สุด",
                "icon": "🚰"
            },
            {
                "num": 4,
                "title": "แผนผังเส้นทางขนส่งผลไม้ทุเรียนเมืองจันทบุรี",
                "formula": "\\min \\sum c_{ij} x_{ij} \\quad \\text{Logistics Routing Optimization}",
                "desc": "การจำลองเส้นทางกระจายผลผลิตจากสวนสู่โรงคัดบรรจุและตลาดส่งออกด้วยผังกราฟถ่วงน้ำหนัก",
                "icon": "🚚"
            },
            {
                "num": 5,
                "title": "ปฏิบัติการจำลองการล่มสลายและกู้คืนเครือข่ายสื่อสาร",
                "formula": "\\text{Node Connectivity } \\kappa(G) \\quad \\text{Fault-Tolerance}",
                "desc": "การทดสอบการตัดโหนดเราเตอร์ในเครือข่ายและสังเกตการเปลี่ยนเส้นทางส่งข้อมูลสำรองอัตโนมัติ",
                "icon": "📡"
            }
        ]
    },
    {
        "num": 10,
        "title": "กิจกรรมอันปลั๊ก 5 การจำลองการสื่อสารและโครงงานอันปลั๊กแก้ปัญหาชุมชน",
        "theme": "protocols_capstone",
        "accent": "#f43f5e",
        "formula": "\\text{Packet} = [\\text{Header} \\mid \\text{Payload} \\mid \\text{Checksum}]",
        "subtopics": [
            {
                "num": 1,
                "title": "การส่งผ่านแพ็กเก็ตข้อมูลแบบเกมส่งสาร",
                "formula": "\\text{Packet Switching} \\quad \\text{Sequence Numbers \\& Ack}",
                "desc": "กิจกรรมส่งต่อกระดาษข้อความที่ถูกตัดแบ่งเป็นส่วนๆ พร้อมหมายเลขลำดับเพื่อประกอบคืนที่ปลายทาง",
                "icon": "📨"
            },
            {
                "num": 2,
                "title": "การตรวจจับและแก้ข้อผิดพลาดด้วยพาริตีตาราง 2 มิติ",
                "formula": "H(x) = \\text{Error Syndrome} \\implies \\text{Single Bit Correction}",
                "desc": "การสร้างการ์ดตรวจสอบพาริตีแถวและคอลัมน์เพื่อตรวจจับและชี้ตำแหน่งบิตที่ถูกดัดแปลง",
                "icon": "🛡️"
            },
            {
                "num": 3,
                "title": "วงล้อถอดรหัสลับซีซาร์และรหัสลับแทนที่",
                "formula": "C = (P + k) \\pmod{26}, \\quad P = (C - k) \\pmod{26}",
                "desc": "การประดิษฐ์วงล้อกระดาษสองชั้นหมุนเลื่อนตัวอักษรเพื่อเรียนรู้รากฐานการเข้ารหัสลับ (Cryptography)",
                "icon": "🔐"
            },
            {
                "num": 4,
                "title": "โครงงานจำลองระบบจัดการน้ำและดินอัจฉริยะอันปลั๊ก",
                "formula": "\\text{Smart Logic} = f(\\text{Soil Moisture}, \\text{Rainfall}, \\text{Crop Stage})",
                "desc": "การออกแบบขั้นตอนวิธีแก้ปัญหาภัยแล้งและน้ำท่วมในชุมชนด้วยผังตรรกะแบบไม่ใช้ไฟฟ้า",
                "icon": "🌾"
            },
            {
                "num": 5,
                "title": "มหกรรมโครงงานนวัตกรรมอันปลั๊กและการเชื่อมต่อสู่โลกโค้ด",
                "formula": "\\text{Unplugged Concept} \\xrightarrow{\\text{Translation}} \\text{Python / C++ Implementation}",
                "desc": "การแปลงกิจกรรมอันปลั๊กทั้งหมดที่เรียนรู้มาให้กลายเป็นโค้ดโปรแกรมจริงในคอมพิวเตอร์และระบบสมองกล",
                "icon": "🚀"
            }
        ]
    }
]

def generate_svg_cover(ch):
    num = ch["num"]
    title = ch["title"]
    accent = ch["accent"]
    formula = ch["formula"]
    
    return f"""<svg class="cover-svg-anim" viewBox="0 0 760 220" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad{num}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#040714"/>
      <stop offset="50%" stop-color="#0b1329"/>
      <stop offset="100%" stop-color="#02050e"/>
    </linearGradient>
    <linearGradient id="neonGrad{num}" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="{accent}"/>
      <stop offset="100%" stop-color="#38bdf8"/>
    </linearGradient>
    <pattern id="grid{num}" width="30" height="30" patternUnits="userSpaceOnUse">
      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(56, 189, 248, 0.08)" stroke-width="1"/>
    </pattern>
    <filter id="glow{num}" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <style>
    @keyframes pulse-core{num} {{
      0%, 100% {{ transform: scale(1); opacity: 0.8; }}
      50% {{ transform: scale(1.12); opacity: 1; }}
    }}
    @keyframes spin-geo{num} {{
      from {{ transform: rotate(0deg); }}
      to {{ transform: rotate(360deg); }}
    }}
    @keyframes flow-line{num} {{
      to {{ stroke-dashoffset: -60; }}
    }}
    .core-anim{num} {{ transform-origin: 660px 110px; animation: pulse-core{num} 3s infinite ease-in-out; }}
    .spin-anim{num} {{ transform-origin: 660px 110px; animation: spin-geo{num} 20s linear infinite; }}
    .flow-anim{num} {{ stroke-dasharray: 10, 5; animation: flow-line{num} 1.5s linear infinite; }}
  </style>

  <!-- Background -->
  <rect width="760" height="220" fill="url(#bgGrad{num})"/>
  <rect width="760" height="220" fill="url(#grid{num})"/>

  <!-- Left Cyber Deco Line -->
  <line x1="24" y1="20" x2="24" y2="200" stroke="{accent}" stroke-width="4" filter="url(#glow{num})"/>
  <circle cx="24" cy="20" r="4" fill="{accent}"/>
  <circle cx="24" cy="200" r="4" fill="{accent}"/>

  <!-- Badge -->
  <rect x="44" y="24" width="280" height="26" rx="6" fill="rgba(56, 189, 248, 0.12)" stroke="{accent}" stroke-width="1"/>
  <text x="56" y="42" font-family="'Chakra Petch', sans-serif" font-size="11" font-weight="700" fill="{accent}" letter-spacing="1">
    COMPUTING SCIENCE 1 • CHAPTER {num:02d}
  </text>

  <!-- Chapter Title (Thai) -->
  <text x="44" y="86" font-family="'Sarabun', sans-serif" font-size="22" font-weight="700" fill="#ffffff" filter="drop-shadow(0 2px 8px rgba(0,0,0,0.8))">
    บทที่ {num} {title[:32]}
  </text>
  <text x="44" y="116" font-family="'Sarabun', sans-serif" font-size="16" font-weight="600" fill="#94a3b8">
    {title[32:] if len(title) > 32 else 'การคิดเชิงคำนวณและกิจกรรมอันปลั๊ก 5 มิติ'}
  </text>

  <!-- Formula Callout Box -->
  <rect x="44" y="142" width="460" height="48" rx="8" fill="rgba(2, 6, 23, 0.85)" stroke="rgba(56, 189, 248, 0.3)" stroke-width="1"/>
  <text x="58" y="162" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="700" fill="{accent}">
    CORE PRINCIPLE &amp; FORMULA:
  </text>
  <text x="58" y="180" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="600" fill="#fde047">
    {formula}
  </text>

  <!-- 3D Geometric Vector Focal at Right -->
  <g class="spin-anim{num}">
    <polygon points="660,40 730,110 660,180 590,110" fill="none" stroke="{accent}" stroke-width="1.5" stroke-dasharray="6, 4" opacity="0.6"/>
    <circle cx="660" cy="110" r="55" fill="none" stroke="#38bdf8" stroke-width="1.2" opacity="0.4"/>
  </g>
  <g class="core-anim{num}">
    <circle cx="660" cy="110" r="32" fill="url(#neonGrad{num})" opacity="0.25" filter="url(#glow{num})"/>
    <circle cx="660" cy="110" r="18" fill="{accent}" opacity="0.8" filter="url(#glow{num})"/>
    <circle cx="660" cy="110" r="6" fill="#ffffff"/>
  </g>

  <!-- Flowing Data Stream Lines -->
  <path d="M 504 166 Q 580 166 660 110" fill="none" stroke="{accent}" stroke-width="2" class="flow-anim{num}" opacity="0.7"/>
</svg>
"""

def generate_simulator_html(ch, sub):
    ch_num = ch["num"]
    sub_num = sub["num"]
    title = sub["title"]
    accent = ch["accent"]
    formula = sub["formula"]
    desc = sub["desc"]
    icon = sub["icon"]

    return f"""<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sim {ch_num}.{sub_num}: {title} • RBRU MOOC</title>
  <link rel="stylesheet" href="../assets/css/mooc_master.css">
  <script src="../assets/js/ar_mediapipe_controller.js"></script>
  <style>
    body {{
      padding: 16px;
      background: #030712;
      color: #f1f5f9;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
    }}
    .sim-card {{
      width: 100%;
      max-width: 900px;
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid rgba(56, 189, 248, 0.3);
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.7);
    }}
    .sim-header {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      padding-bottom: 12px;
    }}
    .sim-canvas-wrap {{
      position: relative;
      width: 100%;
      height: 380px;
      background: radial-gradient(circle at center, #0a1128 0%, #02050e 100%);
      border: 1px solid rgba(56, 189, 248, 0.2);
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 20px;
      box-shadow: inset 0 0 30px rgba(0,0,0,0.8);
    }}
    canvas {{
      width: 100%;
      height: 100%;
      display: block;
    }}
    .controls-row {{
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: center;
      margin-bottom: 20px;
    }}
    .btn-action {{
      background: rgba(56, 189, 248, 0.2);
      border: 1px solid #38bdf8;
      color: #38bdf8;
      padding: 8px 18px;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }}
    .btn-action:hover {{
      background: #38bdf8;
      color: #020617;
      box-shadow: 0 0 20px rgba(56, 189, 248, 0.5);
    }}
    .metric-badge {{
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.15);
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 0.85rem;
      color: #fde047;
      font-family: 'JetBrains Mono', monospace;
    }}
    .quiz-box {{
      background: rgba(2, 6, 23, 0.8);
      border-left: 4px solid #fde047;
      padding: 14px 18px;
      border-radius: 0 10px 10px 0;
      margin-top: 16px;
    }}
  </style>
</head>
<body>
  <div class="sim-card">
    <div class="sim-header">
      <div>
        <span style="font-size: 0.85rem; font-weight: 700; color: {accent}; letter-spacing: 1px;">
          LAB SIMULATOR {ch_num}.{sub_num}
        </span>
        <h2 style="font-size: 1.35rem; color: #fff; margin-top: 4px;">{icon} {title}</h2>
      </div>
      <div class="metric-badge" id="state-display">STATUS: READY</div>
    </div>

    <div class="formula-card-cyber" style="margin: 0 0 16px;">
      <div class="formula-box">{formula}</div>
      <div class="param-list">{desc}</div>
    </div>

    <div class="sim-canvas-wrap">
      <canvas id="simCanvas"></canvas>
      <div id="hand-pointer" style="
        position: absolute; width: 22px; height: 22px; border-radius: 50%;
        border: 2px solid #fde047; background: rgba(253, 224, 71, 0.3);
        pointer-events: none; transform: translate(-50%, -50%); display: none;
        box-shadow: 0 0 15px #fde047;
      "></div>
    </div>

    <div class="controls-row">
      <button class="btn-action" id="btn-run" onclick="runSim()">▶ เริ่มจำลอง (Run)</button>
      <button class="btn-action" id="btn-step" onclick="stepSim()">⏭️ ทีละสเต็ป (Step)</button>
      <button class="btn-action" id="btn-reset" onclick="resetSim()" style="border-color: #f43f5e; color: #f43f5e;">🔄 รีเซ็ต (Reset)</button>
      
      <div style="flex-grow: 1; text-align: right;">
        <label style="font-size: 0.85rem; color: #94a3b8; margin-right: 8px;">ความเร็วจำลอง:</label>
        <input type="range" id="speed-slider" min="1" max="5" value="3" style="vertical-align: middle;">
      </div>
    </div>

    <div class="quiz-box">
      <div style="font-weight: 700; color: #fde047; margin-bottom: 6px;">💡 คำถามประเมินความเข้าใจรวดเร็ว (Concept Check):</div>
      <div style="font-size: 0.92rem; color: #cbd5e1; margin-bottom: 10px;">
        หากระบบรับค่าพารามิเตอร์ขนาด $N$ เพิ่มขึ้น 10 เท่า ประสิทธิภาพเวลาการทำงานจะเป็นไปตามสูตรใด?
      </div>
      <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        <button class="btn-action" style="font-size: 0.8rem; padding: 4px 12px;" onclick="checkAnswer(true)">A) เป็นไปตามสัญกรณ์ Big-O ที่วิเคราะห์ไว้</button>
        <button class="btn-action" style="font-size: 0.8rem; padding: 4px 12px;" onclick="checkAnswer(false)">B) เพิ่มขึ้นแบบก้าวกระโดดไร้ขอบเขต</button>
      </div>
      <div id="quiz-feedback" style="margin-top: 8px; font-size: 0.85rem; font-weight: 600;"></div>
    </div>
  </div>

  <script>
    const canvas = document.getElementById('simCanvas');
    const ctx = canvas.getContext('2d');
    const stateDisplay = document.getElementById('state-display');
    const handPointer = document.getElementById('hand-pointer');

    let simRunning = false;
    let stepCount = 0;
    let particles = [];
    const chId = {ch_num};
    const subId = {sub_num};

    function resize() {{
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
      initScene();
    }}
    window.addEventListener('resize', resize);

    function initScene() {{
      particles = [];
      const numP = 24;
      for (let i = 0; i < numP; i++) {{
        particles.push({{
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          val: Math.floor(Math.random() * 90) + 10,
          color: '{accent}'
        }});
      }}
    }}

    function draw() {{
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Grid / Connectors
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.1)';
      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {{
        for (let j = i + 1; j < particles.length; j++) {{
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx*dx + dy*dy);
          if (d < 110) {{
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }}
        }}
      }}

      // Draw Nodes
      for (let p of particles) {{
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '10px JetBrains Mono';
        ctx.fillText(p.val, p.x + 12, p.y + 4);

        if (simRunning) {{
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 10 || p.x > canvas.width - 10) p.vx *= -1;
          if (p.y < 10 || p.y > canvas.height - 10) p.vy *= -1;
        }}
      }}

      // Info Overlay
      ctx.fillStyle = 'rgba(56, 189, 248, 0.7)';
      ctx.font = '12px Sarabun';
      ctx.fillText(`สเต็ปการประมวลผล: ${{stepCount}} | พิกัดสถานะ: ${{particles.length}} โหนด`, 16, 24);

      requestAnimationFrame(draw);
    }}

    function runSim() {{
      simRunning = true;
      stateDisplay.textContent = 'STATUS: SIMULATING...';
      stateDisplay.style.color = '#38bdf8';
      if (window.arController) window.arController.playSynth('action');
    }}

    function stepSim() {{
      simRunning = false;
      stepCount++;
      stateDisplay.textContent = `STATUS: STEP ${{stepCount}}`;
      stateDisplay.style.color = '#fde047';
      for (let p of particles) {{
        p.x += p.vx * 3;
        p.y += p.vy * 3;
      }}
      if (window.arController) window.arController.playSynth('pinch');
    }}

    function resetSim() {{
      simRunning = false;
      stepCount = 0;
      stateDisplay.textContent = 'STATUS: RESET';
      stateDisplay.style.color = '#f43f5e';
      initScene();
      if (window.arController) window.arController.playSynth('swipe');
    }}

    function checkAnswer(isCorrect) {{
      const fb = document.getElementById('quiz-feedback');
      if (isCorrect) {{
        fb.textContent = '✅ ถูกต้องยอดเยี่ยม! ระบบทำงานสอดคล้องกับขอบเขตสัญกรณ์ Asymptotic Complexity';
        fb.style.color = '#4ade80';
        if (window.arController) window.arController.playSynth('action');
      }} else {{
        fb.textContent = '❌ ยังไม่ถูกต้อง ลองพิจารณาความสัมพันธ์ของฟังก์ชันในกล่องสูตรอีกครั้ง';
        fb.style.color = '#f43f5e';
      }}
    }}

    // AR MediaPipe Hands Hook
    window.addEventListener('load', () => {{
      resize();
      draw();

      if (window.ARMediaPipeController) {{
        window.arController = new window.ARMediaPipeController({{
          onHandMove: (x, y, isPinching) => {{
            handPointer.style.display = 'block';
            handPointer.style.left = (x * canvas.width) + 'px';
            handPointer.style.top = (y * canvas.height) + 'px';

            if (isPinching) {{
              handPointer.style.borderColor = '#38bdf8';
              stepSim();
            }} else {{
              handPointer.style.borderColor = '#fde047';
            }}
          }},
          onSwipe: (dir) => {{
            if (dir === 'right') stepSim();
            else resetSim();
          }}
        }});
      }}
    }});
  </script>
</body>
</html>
"""

def generate_master_spa():
    chapters_json = json.dumps(CHAPTERS_DATA, ensure_ascii=False, indent=2)
    
    html = f"""<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RBRU MOOC • วิทยาการคำนวณ ๑ การคิดเชิงคำนวณและกิจกรรมอันปลั๊ก</title>
  <link rel="stylesheet" href="assets/css/mooc_master.css">
  <script src="assets/js/ar_mediapipe_controller.js"></script>
</head>
<body>
  <div class="mooc-container">
    <header class="mooc-header">
      <div class="mooc-badge">RBRU MOOC MASTERCLASS • 60 FPS 3D &amp; AR EDITION</div>
      <h1 class="mooc-title">วิทยาการคำนวณ ๑ การคิดเชิงคำนวณและกิจกรรมอันปลั๊ก</h1>
      <p class="mooc-subtitle">
        หลักสูตรออนไลน์เชิงปฏิบัติการตามกรอบ OBE และ Bloom's Taxonomy • รหัสวิชา 4011101 การคิดเชิงคำนวณและขั้นตอนวิธีพื้นฐาน • รองรับการสั่งการ 3 มิติไร้สัมผัส AR MediaPipe Hands
      </p>
      <div class="course-meta-pills">
        <span class="meta-pill">👨‍🏫 ผู้ช่วยศาสตราจารย์ ดร.ชีวะ ทัศนา</span>
        <span class="meta-pill">🏛️ มหาวิทยาลัยราชภัฏรำไพพรรณี</span>
        <span class="meta-pill">📚 10 บทเรียน • 50 Interactive Labs</span>
        <span class="meta-pill">🎓 พ.ศ. ๒๕๗๐</span>
      </div>
    </header>

    <!-- Chapter Navigation Tabs -->
    <div class="chapter-nav-bar" id="chapterTabs">
      <!-- Generated via JS -->
    </div>

    <!-- Active Chapter 3D Animated SVG Cover -->
    <div class="cover-svg-wrapper" id="coverContainer">
      <!-- Injected via JS -->
    </div>

    <!-- Active Chapter Topic Cards Grid -->
    <div class="topics-grid-3d" id="topicsGrid">
      <!-- Injected via JS -->
    </div>

    <!-- Interactive Simulator Iframe Viewer -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
      <h3 style="font-size: 1.25rem; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 8px;">
        <span style="color: #38bdf8;">🔬</span> ห้องปฏิบัติการจำลองเสมือนจริง (Interactive Live Simulator)
      </h3>
      <div style="display: flex; gap: 10px;">
        <button class="btn-enter-lesson" style="padding: 6px 14px; font-size: 0.8rem;" onclick="toggleFullscreenSim()">
          ⛶ เต็มจอ (Fullscreen)
        </button>
      </div>
    </div>

    <div class="sim-embed-wrap" id="simWrapper">
      <iframe id="mainSimIframe" src="simulators/sim_1_1.html" allow="camera; autoplay;"></iframe>
    </div>
  </div>

  <script>
    const courseData = {chapters_json};
    let currentChIndex = 0;

    function initNav() {{
      const nav = document.getElementById('chapterTabs');
      nav.innerHTML = '';
      courseData.forEach((ch, idx) => {{
        const btn = document.createElement('div');
        btn.className = `chapter-nav-item ${{idx === 0 ? 'active' : ''}}`;
        btn.textContent = `บทที่ ${{ch.num}} ${{ch.title[:20]}}...`;
        btn.onclick = () => selectChapter(idx);
        nav.appendChild(btn);
      }});
      renderChapter(0);
    }}

    function selectChapter(idx) {{
      currentChIndex = idx;
      document.querySelectorAll('.chapter-nav-item').forEach((el, i) => {{
        el.classList.toggle('active', i === idx);
      }});
      renderChapter(idx);
      if (window.arController) window.arController.playSynth('action');
    }}

    async function renderChapter(idx) {{
      const ch = courseData[idx];
      
      // Load SVG Cover
      try {{
        const res = await fetch(`covers/cover_ch${{String(ch.num).padStart(2, '0')}}.svg`);
        const svgText = await res.text();
        document.getElementById('coverContainer').innerHTML = svgText;
      }} catch (e) {{
        console.warn('Load cover error', e);
      }}

      // Render 5 Topic Cards
      const grid = document.getElementById('topicsGrid');
      grid.innerHTML = '';
      ch.subtopics.forEach(sub => {{
        const card = document.createElement('div');
        card.className = 'topic-card-3d';
        card.innerHTML = `
          <div>
            <div class="card-top-header">
              <div class="card-icon-3d">${{sub.icon}}</div>
              <div class="topic-badge">${{ch.num}}.${{sub.num}}</div>
            </div>
            <h3 class="topic-title">${{sub.title}}</h3>
            <div class="formula-badge">${{sub.formula}}</div>
            <p class="topic-summary">${{sub.desc}}</p>
          </div>
          <button class="btn-enter-lesson" onclick="loadSimulator(${{ch.num}}, ${{sub.num}})">
            <span>🚀 เข้าสู่บทเรียน &amp; ปฏิบัติการ</span>
            <span class="arrow-icon">→</span>
          </button>
        `;
        grid.appendChild(card);
      }});

      // Auto load first simulator of this chapter
      loadSimulator(ch.num, 1);
    }}

    function loadSimulator(chNum, subNum) {{
      const iframe = document.getElementById('mainSimIframe');
      iframe.src = `simulators/sim_${{chNum}}_${{subNum}}.html?v=2027`;
      document.getElementById('simWrapper').scrollIntoView({{ behavior: 'smooth' }});
      if (window.arController) window.arController.playSynth('pinch');
    }}

    function toggleFullscreenSim() {{
      const elem = document.getElementById('simWrapper');
      if (!document.fullscreenElement) {{
        elem.requestFullscreen().catch(err => alert(err.message));
      }} else {{
        document.exitFullscreen();
      }}
    }}

    window.addEventListener('load', () => {{
      initNav();
      if (window.ARMediaPipeController) {{
        window.arController = new window.ARMediaPipeController({{
          onSwipe: (dir) => {{
            if (dir === 'right') {{
              selectChapter((currentChIndex + 1) % courseData.length);
            }} else {{
              selectChapter((currentChIndex - 1 + courseData.length) % courseData.length);
            }}
          }}
        }});
      }}
    }});
  </script>
</body>
</html>
"""
    return html

def generate_moodle_section(ch):
    num = ch["num"]
    title = ch["title"]
    accent = ch["accent"]
    formula = ch["formula"]
    
    cards_html = ""
    for sub in ch["subtopics"]:
        cards_html += f"""
  <div class="topic-card-3d">
    <div class="card-top-header">
      <div class="card-icon-3d">{sub['icon']}</div>
      <div class="topic-badge">{num}.{sub['num']}</div>
    </div>
    <h3 class="topic-title">{sub['title']}</h3>
    <div class="formula-badge">{sub['formula']}</div>
    <p class="topic-summary">{sub['desc']}</p>
    <a href="https://elearning.rbru.ac.th/mod/page/view.php?id={4900 + num*10 + sub['num']}" class="btn-enter-lesson" target="_blank">
      <span>🚀 เข้าสู่บทเรียน &amp; ปฏิบัติการจำลอง</span>
      <span class="arrow-icon">→</span>
    </a>
  </div>
"""

    return f"""<!-- RBRU MOOC Section {num} Summary -->
<div class="rbru-mooc-section-wrap" style="font-family: 'Sarabun', sans-serif;">
  <div class="cover-svg-wrapper">
    <iframe src="https://tsanaphy2023.github.io/CS2027/RBRU_MOOC_CS_VOL1/covers/cover_ch{num:02d}.svg" style="width:100%; height:220px; border:none;" scrolling="no"></iframe>
  </div>

  <div class="formula-card-cyber">
    <div class="formula-box">{formula}</div>
    <div class="param-list">
      มโนทัศน์แกนกลางประจำบทที่ {num} • ผลลัพธ์การเรียนรู้ OBE ตามอนุกรมวิธานของบลูม
    </div>
  </div>

  <div class="topics-grid-3d">
{cards_html}
  </div>

  <div class="sim-embed-wrap">
    <iframe src="https://tsanaphy2023.github.io/CS2027/RBRU_MOOC_CS_VOL1/simulators/sim_{num}_1.html?v=2027" style="width:100%; height:100%; border:none;" allow="camera; autoplay;"></iframe>
  </div>
</div>
"""

def main():
    print("=== Building RBRU MOOC Course for CS_Vol1 ===")
    
    # 1. Save course_data.json
    course_data_path = os.path.join(MOOC_DIR, "course_data.json")
    with open(course_data_path, "w", encoding="utf-8") as f:
        json.dump(CHAPTERS_DATA, f, ensure_ascii=False, indent=2)
    print(f"  ✓ Saved course_data.json (10 chapters, 50 subtopics)")

    # 2. Generate 10 Animated SVG Covers
    for ch in CHAPTERS_DATA:
        svg_content = generate_svg_cover(ch)
        svg_file = os.path.join(COVERS_DIR, f"cover_ch{ch['num']:02d}.svg")
        with open(svg_file, "w", encoding="utf-8") as f:
            f.write(svg_content)
        print(f"  ✓ Generated 3D Animated SVG Cover: covers/cover_ch{ch['num']:02d}.svg")

    # 3. Generate 50 Interactive Simulators
    count_sims = 0
    for ch in CHAPTERS_DATA:
        for sub in ch["subtopics"]:
            sim_html = generate_simulator_html(ch, sub)
            sim_file = os.path.join(SIMS_DIR, f"sim_{ch['num']}_{sub['num']}.html")
            with open(sim_file, "w", encoding="utf-8") as f:
                f.write(sim_html)
            count_sims += 1
    print(f"  ✓ Generated {count_sims} Standalone Interactive Simulators in simulators/")

    # 4. Generate Moodle Export HTMLs
    for ch in CHAPTERS_DATA:
        sec_html = generate_moodle_section(ch)
        sec_file = os.path.join(MOODLE_DIR, f"moodle_section_{ch['num']:02d}.html")
        with open(sec_file, "w", encoding="utf-8") as f:
            f.write(sec_html)
    print(f"  ✓ Generated 10 Moodle-ready Section Summaries in moodle_export/")

    # 5. Generate Master SPA index.html
    spa_html = generate_master_spa()
    spa_file = os.path.join(MOOC_DIR, "index.html")
    with open(spa_file, "w", encoding="utf-8") as f:
        f.write(spa_html)
    print(f"  ✓ Generated Master MOOC Interactive Portal: index.html")

    print("\n=== RBRU MOOC CS_Vol1 Successfully Built! ===")

if __name__ == "__main__":
    main()
